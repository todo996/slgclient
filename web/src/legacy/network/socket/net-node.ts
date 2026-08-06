import { EventMgr } from "../../events/event-manager";
import {
  NetEvent,
  ReceiveMessageEvent,
  RequestObject,
  type IncomingEnvelope,
  type NetTimeoutData,
  type OutgoingEnvelope,
  type SocketConnectOptions,
} from "./net-interface";
import { NetTimer } from "./net-timer";
import { WebSock } from "./web-sock";

export enum NetTipsType {
  Connecting,
  ReConnecting,
  Requesting,
}

export enum NetNodeState {
  Closed,
  Connecting,
  Checking,
  Working,
}

export enum NetNodeType {
  BaseServer,
  ChatServer,
}

export type NetConnectOptions = SocketConnectOptions &
  Readonly<{
    autoReconnect?: number;
    type?: NetNodeType;
  }>;

export type NetworkStateSnapshot = Readonly<{
  state: NetNodeState;
  reconnectRemaining: number;
}>;

export type NetResponsePair<
  Response extends IncomingEnvelope | NetTimeoutData =
    | IncomingEnvelope
    | NetTimeoutData,
> = Readonly<{
  req: OutgoingEnvelope;
  rsp: Response;
}>;

const DEFAULT_RECONNECT_COUNT = 3;
const HEARTBEAT_INTERVAL_MS = 10_000;
const REQUEST_TIMEOUT_MS = 10_000;
const RECONNECT_DELAY_MS = 2_000;
const MAX_SEQUENCE_ID = 1_000_000;

export class NetNode {
  private connectOptions: NetConnectOptions | null = null;
  private reconnectConfigured = DEFAULT_RECONNECT_COUNT;
  private reconnectRemaining = DEFAULT_RECONNECT_COUNT;
  private state = NetNodeState.Closed;

  private readonly socket = new WebSock();
  private readonly timer = new NetTimer();

  private heartbeatTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private manuallyClosed = false;

  private readonly requests: RequestObject[] = [];
  private sequenceId = 1;
  private readonly invokePool: RequestObject[] = [];

  constructor() {
    this.initSocket();
    EventMgr.on(
      NetEvent.ServerHandShake,
      this.onChecked,
      this,
    );
    EventMgr.on(
      NetEvent.ServerTimeOut,
      this.onTimeOut,
      this,
    );
  }

  connect(options: NetConnectOptions): boolean {
    this.connectOptions = { ...options };
    this.reconnectConfigured =
      options.autoReconnect ?? DEFAULT_RECONNECT_COUNT;
    this.reconnectRemaining = this.reconnectConfigured;
    this.manuallyClosed = false;

    return this.openSocket();
  }

  changeConect(options: NetConnectOptions): void {
    this.changeConnect(options);
  }

  changeConnect(options: NetConnectOptions): void {
    this.closeSocket();
    this.connect(options);
  }

  send(
    sendData: OutgoingEnvelope,
    otherData: unknown = {},
    force = false,
  ): Promise<NetResponsePair> {
    if (sendData.seq === undefined) {
      sendData.seq = 0;
    }

    const request = this.createInvoke();
    request.json = sendData;
    request.rspName = sendData.name;
    request.otherData = otherData;

    const responsePromise = new Promise<NetResponsePair>((resolve) => {
      const target = {};
      const onResponse = (
        response: IncomingEnvelope | NetTimeoutData,
        responseRequest: RequestObject,
      ): void => {
        if (request !== responseRequest || !request.json) {
          return;
        }

        EventMgr.off(
          ReceiveMessageEvent,
          onResponse,
          target,
        );

        resolve({
          req: request.json,
          rsp: response,
        });
      };

      EventMgr.on(
        ReceiveMessageEvent,
        onResponse,
        target,
      );
    });

    this.sendPack(request, force);
    return responsePromise;
  }

  sendPack(request: RequestObject, force = false): boolean {
    this.queueRequest(request);

    if (this.state === NetNodeState.Working || force) {
      return this.socketSend(request);
    }

    if (
      this.state === NetNodeState.Connecting ||
      this.state === NetNodeState.Checking
    ) {
      return true;
    }

    if (this.state === NetNodeState.Closed) {
      if (!this.connectOptions) {
        throw new Error(
          "NetNode chưa có cấu hình kết nối",
        );
      }

      this.openSocket();
      return true;
    }

    return false;
  }

  tryConnet(): void {
    this.tryConnect();
  }

  tryConnect(): void {
    this.scheduleReconnect();
  }

  closeSocket(code?: number, reason?: string): void {
    this.manuallyClosed = true;
    this.clearAllTimers();

    this.requests.length = 0;
    this.sequenceId = 1;
    this.reconnectRemaining = 0;
    this.setState(NetNodeState.Closed);

    this.socket.close(code, reason);
  }

  rejectReconnect(): void {
    this.reconnectRemaining = 0;
    this.clearReconnectTimer();
  }

  destroy(): void {
    this.closeSocket();
    this.timer.destroy();
    EventMgr.targetOff(this);
  }

  getState(): NetNodeState {
    return this.state;
  }

  private initSocket(): void {
    this.socket.onConnected = (event) => {
      this.onConnected(event);
    };
    this.socket.onJsonMessage = (message) => {
      this.onMessage(message);
    };
    this.socket.onError = (event) => {
      this.onError(event);
    };
    this.socket.onClosed = (event) => {
      this.onClosed(event);
    };
    this.socket.onGetKey = () => {
      this.onGetKey();
    };
  }

  private openSocket(): boolean {
    if (!this.connectOptions) return false;

    if (this.state !== NetNodeState.Closed) {
      return false;
    }

    this.setState(NetNodeState.Connecting);

    try {
      const started = this.socket.connect(this.connectOptions);
      if (!started) {
        this.setState(NetNodeState.Closed);
      }
      return started;
    } catch (error) {
      this.setState(NetNodeState.Closed);
      EventMgr.emit(NetEvent.NetworkError, error);
      this.scheduleReconnect();
      return false;
    }
  }

  private onConnected(_event: Event): void {
    this.reconnectRemaining = this.reconnectConfigured;
    this.clearReconnectTimer();
    this.setState(NetNodeState.Checking);
    this.resetHeartbeatTimer();
    EventMgr.emit(NetEvent.ServerConnected);
  }

  private onGetKey(): void {
    this.setState(NetNodeState.Working);
    EventMgr.emit(NetEvent.ServerCheckLogin);
  }

  private readonly onChecked = (): void => {
    for (const request of this.requests) {
      if (!request.sended) {
        this.socketSend(request);
      }
    }
  };

  private readonly onTimeOut = (
    message: NetTimeoutData,
  ): void => {
    for (let index = 0; index < this.requests.length; index += 1) {
      const request = this.requests[index];

      if (
        message.name !== request.rspName ||
        message.seq !== request.seq
      ) {
        continue;
      }

      this.requests.splice(index, 1);
      EventMgr.emit(
        ReceiveMessageEvent,
        message,
        request,
      );
      this.destroyInvoke(request);
      return;
    }
  };

  private onMessage(message: IncomingEnvelope): void {
    if (message.seq === 0) {
      EventMgr.emit(message.name, message);
      return;
    }

    this.timer.cancel(message);

    for (let index = 0; index < this.requests.length; index += 1) {
      const request = this.requests[index];

      if (
        message.name !== request.rspName ||
        message.seq !== request.seq ||
        !request.sended
      ) {
        continue;
      }

      this.requests.splice(index, 1);
      EventMgr.emit(
        ReceiveMessageEvent,
        message,
        request,
      );
      EventMgr.emit(
        message.name,
        message,
        request.otherData,
      );
      EventMgr.emit(
        NetEvent.ServerRequestSucess,
        message,
      );
      this.destroyInvoke(request);
      return;
    }
  }

  private onError(event: Event | Error): void {
    EventMgr.emit(NetEvent.NetworkError, event);
    this.clearHeartbeatTimer();
    this.resetRequests();
    this.socket.close(1011, "network error");
    this.scheduleReconnect();
  }

  private onClosed(_event: CloseEvent): void {
    this.clearHeartbeatTimer();
    this.timer.destroy();
    this.setState(NetNodeState.Closed);

    if (!this.manuallyClosed) {
      this.resetRequests();
      this.scheduleReconnect();
    }
  }

  private socketSend(request: RequestObject): boolean {
    if (!request.json) return false;

    const sequence = this.nextSequence();
    request.seq = sequence;
    request.json.seq = sequence;
    request.startTime = Date.now();

    const sent = this.socket.packAndSend(request.json);
    request.sended = sent;

    if (sent) {
      this.timer.schedule(
        {
          name: request.json.name,
          seq: sequence,
        },
        REQUEST_TIMEOUT_MS,
      );
    }

    return sent;
  }

  private createHeartbeat(): RequestObject {
    const request = this.createInvoke();
    request.json = {
      name: "heartbeat",
      msg: {
        ctime: Date.now(),
      },
      seq: 0,
    };
    request.rspName = "heartbeat";
    return request;
  }

  private resetHeartbeatTimer(): void {
    this.clearHeartbeatTimer();

    this.heartbeatTimer = window.setInterval(() => {
      this.sendPack(this.createHeartbeat());
    }, HEARTBEAT_INTERVAL_MS);
  }

  private scheduleReconnect(): void {
    if (
      this.manuallyClosed ||
      this.reconnectTimer !== null ||
      !this.isAutoReconnect() ||
      !this.connectOptions
    ) {
      return;
    }

    this.setState(NetNodeState.Closed);

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;

      if (this.reconnectRemaining > 0) {
        this.reconnectRemaining -= 1;
      }

      this.openSocket();
    }, RECONNECT_DELAY_MS);
  }

  private isAutoReconnect(): boolean {
    return (
      this.reconnectRemaining === -1 ||
      this.reconnectRemaining > 0
    );
  }

  private resetRequests(): void {
    for (const request of this.requests) {
      request.sended = false;
    }
  }

  private queueRequest(request: RequestObject): void {
    if (!this.requests.includes(request)) {
      this.requests.push(request);
    }
  }

  private nextSequence(): number {
    const current = this.sequenceId;
    this.sequenceId =
      this.sequenceId >= MAX_SEQUENCE_ID
        ? 1
        : this.sequenceId + 1;
    return current;
  }

  private createInvoke(): RequestObject {
    return this.invokePool.shift() ?? new RequestObject();
  }

  private destroyInvoke(request: RequestObject): void {
    request.destroy();
    this.invokePool.push(request);
  }

  private setState(state: NetNodeState): void {
    this.state = state;

    const snapshot: NetworkStateSnapshot = {
      state,
      reconnectRemaining: this.reconnectRemaining,
    };

    EventMgr.emit(
      NetEvent.NetworkStateChanged,
      snapshot,
    );
  }

  private clearHeartbeatTimer(): void {
    if (this.heartbeatTimer === null) return;

    window.clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer === null) return;

    window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private clearAllTimers(): void {
    this.clearHeartbeatTimer();
    this.clearReconnectTimer();
    this.timer.destroy();
  }
}
