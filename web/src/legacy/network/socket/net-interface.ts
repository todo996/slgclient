export type NetData =
  | string
  | ArrayBuffer
  | ArrayBufferView
  | Blob;

export type OutgoingEnvelope = {
  name: string;
  msg: unknown;
  seq?: number;
};

export type IncomingEnvelope = {
  name: string;
  msg: any;
  seq: number;
  code?: number;
  [key: string]: unknown;
};

export type NetTimeoutData = Readonly<{
  name: string;
  seq: number;
  timedOut: true;
}>;

export class RequestObject {
  json: OutgoingEnvelope | null = null;
  rspName = "";
  autoReconnect = 0;
  seq = 0;
  sended = false;
  otherData: unknown = {};
  startTime = 0;

  destroy(): void {
    this.json = null;
    this.rspName = "";
    this.autoReconnect = 0;
    this.seq = 0;
    this.sended = false;
    this.otherData = {};
    this.startTime = 0;
  }
}

export type SocketConnectOptions = Readonly<{
  url?: string;
  host?: string;
  ip?: string;
  port?: number;
  protocol?: "ws" | "wss";
  binaryType?: BinaryType;
}>;

export interface ISocket {
  onConnected: (event: Event) => void;
  onJsonMessage: (message: IncomingEnvelope) => void;
  onError: (event: Event | Error) => void;
  onClosed: (event: CloseEvent) => void;
  onGetKey: () => void;

  connect(options: SocketConnectOptions): boolean;
  send(buffer: NetData): boolean;
  close(code?: number, reason?: string): void;
}

export const NetEvent = {
  ServerTimeOut: "ServerTimeOut",
  ServerConnected: "ServerConnected",
  ServerHandShake: "ServerHandShake",
  ServerCheckLogin: "ServerCheckLogin",
  ServerRequesting: "ServerRequesting",
  ServerRequestSucess: "ServerRequestSucess",
  NetworkStateChanged: "NetworkStateChanged",
  NetworkError: "NetworkError",
} as const;

export const ReceiveMessageEvent = "recvMessage";
