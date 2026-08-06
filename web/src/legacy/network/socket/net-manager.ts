import type { OutgoingEnvelope } from "./net-interface";
import {
  NetNode,
  type NetConnectOptions,
  type NetResponsePair,
} from "./net-node";

export class NetManager {
  private static instance: NetManager | null = null;
  private readonly netNode = new NetNode();

  static getInstance(): NetManager {
    if (!this.instance) {
      this.instance = new NetManager();
    }

    return this.instance;
  }

  connect(options: NetConnectOptions): void {
    this.netNode.connect(options);
  }

  send(
    sendData: OutgoingEnvelope,
    otherData: unknown = {},
    force = false,
  ): Promise<NetResponsePair> {
    return this.netNode.send(
      sendData,
      otherData,
      force,
    );
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
    this.netNode.destroy();
    NetManager.instance = null;
  }
}
