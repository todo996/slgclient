import { EventMgr } from "../../events/event-manager";
import { NetEvent, type IncomingEnvelope, type OutgoingEnvelope } from "./net-interface";
import {
  NetNode,
  type NetConnectOptions,
  type NetResponsePair,
} from "./net-node";

export type DemoResponder = (request: OutgoingEnvelope, otherData: unknown) => IncomingEnvelope | Promise<IncomingEnvelope>;

export class NetManager {
  private static instance: NetManager | null = null;
  private readonly netNode = new NetNode();
  private demoResponder: DemoResponder | null = null;
  private demoSequence = 1;

  static getInstance(): NetManager {
    if (!this.instance) {
      this.instance = new NetManager();
    }

    return this.instance;
  }

  connect(options: NetConnectOptions): void {
    if (this.demoResponder) return;
    this.netNode.connect(options);
  }

  enableDemoMode(responder: DemoResponder): void {
    this.demoResponder = responder;
    this.demoSequence = 1;
  }

  disableDemoMode(): void {
    this.demoResponder = null;
    this.demoSequence = 1;
  }

  send(
    sendData: OutgoingEnvelope,
    otherData: unknown = {},
    force = false,
  ): Promise<NetResponsePair> {
    if (this.demoResponder) {
      const request: OutgoingEnvelope = {
        ...sendData,
        seq: sendData.seq && sendData.seq > 0
          ? sendData.seq
          : this.demoSequence++,
      };
      return Promise.resolve(this.demoResponder(request, otherData)).then((response) => {
        queueMicrotask(() => {
          EventMgr.emit(response.name, response, otherData);
          EventMgr.emit(NetEvent.ServerRequestSucess, response);
        });
        return { req: request, rsp: response };
      });
    }

    return this.netNode.send(sendData, otherData, force);
  }

  close(code?: number, reason?: string): void {
    this.netNode.closeSocket(code, reason);
  }

  changeConnect(options: NetConnectOptions): void {
    this.netNode.changeConnect(options);
  }

  tryConnet(): void {
    this.netNode.tryConnect();
  }

  destroy(): void {
    this.disableDemoMode();
    this.netNode.destroy();
    NetManager.instance = null;
  }
}
