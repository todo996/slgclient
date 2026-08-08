import { EventMgr } from "../../events/event-manager";
import {
  NetEvent,
  type NetTimeoutData,
} from "./net-interface";

type MessageIdentity = Readonly<{
  name: string;
  seq: number;
}>;

type NetTimerData = Readonly<{
  name: string;
  seq: number;
  timerId: number;
}>;

export class NetTimer {
  private readonly tokens = new Map<number, NetTimerData>();
  private tokenId = 0;

  schedule(data: MessageIdentity, delay = 0): number {
    const token = this.tokenId;
    this.tokenId += 1;

    const timerId = window.setTimeout(() => {
      this.handleTimeout(token);
    }, delay);

    this.tokens.set(token, {
      name: data.name,
      seq: data.seq,
      timerId,
    });

    return token;
  }

  cancel(data: MessageIdentity | number | null): void {
    if (data === null) return;

    const token =
      typeof data === "number"
        ? data
        : this.findToken(data);

    if (token < 0) return;

    const timerData = this.tokens.get(token);
    if (timerData) {
      window.clearTimeout(timerData.timerId);
    }

    this.tokens.delete(token);
  }

  destroy(): void {
    for (const timerData of this.tokens.values()) {
      window.clearTimeout(timerData.timerId);
    }

    this.tokens.clear();
  }

  private handleTimeout(token: number): void {
    const data = this.tokens.get(token);
    if (!data) return;

    const timeoutData: NetTimeoutData = {
      name: data.name,
      seq: data.seq,
      timedOut: true,
    };

    this.tokens.delete(token);
    EventMgr.emit(NetEvent.ServerTimeOut, timeoutData);
  }

  private findToken(data: MessageIdentity): number {
    for (const [token, timerData] of this.tokens.entries()) {
      if (
        timerData.name === data.name &&
        timerData.seq === data.seq
      ) {
        return token;
      }
    }

    return -1;
  }
}
