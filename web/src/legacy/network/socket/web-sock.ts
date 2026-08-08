import type {
  IncomingEnvelope,
  ISocket,
  NetData,
  SocketConnectOptions,
} from "./net-interface";
import { SocketCodec } from "./socket-codec";

type HandshakeEnvelope = Readonly<{
  name: "handshake";
  msg: {
    key: string;
  };
}>;

export class WebSock implements ISocket {
  private webSocket: WebSocket | null = null;
  private readonly codec = new SocketCodec();

  onConnected: (event: Event) => void = () => undefined;
  onJsonMessage: (message: IncomingEnvelope) => void =
    () => undefined;
  onError: (event: Event | Error) => void = () => undefined;
  onClosed: (event: CloseEvent) => void = () => undefined;
  onGetKey: () => void = () => undefined;

  connect(options: SocketConnectOptions): boolean {
    if (
      this.webSocket?.readyState === WebSocket.CONNECTING ||
      this.webSocket?.readyState === WebSocket.OPEN
    ) {
      return false;
    }

    const url = this.resolveUrl(options);
    const socket = new WebSocket(url);
    socket.binaryType = options.binaryType ?? "arraybuffer";

    socket.onmessage = (event: MessageEvent<NetData>) => {
      if (this.webSocket !== socket) return;
      void this.handleMessage(event.data);
    };
    socket.onopen = (event) => {
      if (this.webSocket !== socket) return;
      this.onConnected(event);
    };
    socket.onerror = (event) => {
      if (this.webSocket !== socket) return;
      this.onError(event);
    };
    socket.onclose = (event) => {
      if (this.webSocket !== socket) return;

      this.webSocket = null;
      this.codec.clearKey();
      this.onClosed(event);
    };

    this.webSocket = socket;
    return true;
  }

  send(buffer: NetData): boolean {
    if (this.webSocket?.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.webSocket.send(buffer);
    return true;
  }

  packAndSend(message: {
    name: string;
    msg: unknown;
    seq?: number;
  }): boolean {
    return this.send(this.codec.pack(message));
  }

  close(code?: number, reason?: string): void {
    this.codec.clearKey();

    const socket = this.webSocket;
    if (!socket) return;

    if (
      socket.readyState === WebSocket.CLOSED ||
      socket.readyState === WebSocket.CLOSING
    ) {
      return;
    }

    socket.close(code, reason);
  }

  private async handleMessage(data: NetData): Promise<void> {
    try {
      const bytes = await this.toUint8Array(data);
      const message = this.codec.unpack(bytes);

      if (!this.codec.hasKey()) {
        const handshake = this.parseHandshake(message);
        if (handshake) {
          this.codec.setKey(handshake.msg.key);
          this.onGetKey();
          return;
        }
      }

      if (!message) {
        this.codec.clearKey();
        return;
      }

      const json = JSON.parse(message) as IncomingEnvelope;
      this.onJsonMessage(json);
    } catch (error) {
      this.onError(
        error instanceof Error
          ? error
          : new Error("Không giải mã được WebSocket message"),
      );
    }
  }

  private parseHandshake(
    message: string,
  ): HandshakeEnvelope | null {
    const data = JSON.parse(message) as Partial<HandshakeEnvelope>;

    if (
      data.name !== "handshake" ||
      typeof data.msg?.key !== "string" ||
      data.msg.key.length === 0
    ) {
      return null;
    }

    return data as HandshakeEnvelope;
  }

  private resolveUrl(options: SocketConnectOptions): string {
    if (options.url) {
      return options.url;
    }

    const host = options.host ?? options.ip;
    if (!host || options.port === undefined) {
      throw new Error(
        "WebSocket cần url hoặc host/ip + port",
      );
    }

    const protocol = options.protocol ?? "ws";
    return `${protocol}://${host}:${options.port}`;
  }

  private async toUint8Array(data: NetData): Promise<Uint8Array> {
    if (typeof data === "string") {
      return new TextEncoder().encode(data);
    }

    if (data instanceof Blob) {
      return new Uint8Array(await data.arrayBuffer());
    }

    if (data instanceof ArrayBuffer) {
      return new Uint8Array(data);
    }

    return Uint8Array.from(
      new Uint8Array(
        data.buffer,
        data.byteOffset,
        data.byteLength,
      ),
    );
  }
}
