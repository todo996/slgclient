import { EventMgr } from "../../events/event-manager";
import { NetEvent } from "../socket/net-interface";

export enum HttpInvokeType {
  GET,
  POST,
}

export class HttpInvoke {
  private readonly receiveTime = 15_000;
  private name = "";
  private otherData: unknown = null;

  init(name: string, otherData: unknown = null): void {
    this.name = name;
    this.otherData = otherData;
  }

  doSend(
    url: string,
    params: string,
    type: HttpInvokeType,
  ): Promise<XMLHttpRequest | null> {
    const xhr = new XMLHttpRequest();
    xhr.timeout = this.receiveTime;

    return new Promise((resolve) => {
      xhr.onreadystatechange = () => {
        if (xhr.readyState !== XMLHttpRequest.DONE) {
          return;
        }

        const completed =
          xhr.status >= 200 && xhr.status < 400
            ? xhr
            : null;

        this.onComplete(completed);
        resolve(completed);
      };

      xhr.ontimeout = () => {
        this.onComplete(null);
        resolve(null);
      };

      xhr.onerror = () => {
        this.onComplete(null);
        resolve(null);
      };

      if (type === HttpInvokeType.GET) {
        const separator = url.includes("?") ? "&" : "?";
        xhr.open(
          "GET",
          `${url}${separator}${params}`,
          true,
        );
        xhr.setRequestHeader(
          "Accept",
          "application/json",
        );
        xhr.send();
        return;
      }

      xhr.open("POST", url, true);
      xhr.setRequestHeader(
        "Content-Type",
        "application/x-www-form-urlencoded;charset=UTF-8",
      );
      xhr.setRequestHeader(
        "Accept",
        "application/json",
      );
      xhr.send(params);
    });
  }

  private onComplete(
    request: XMLHttpRequest | null,
  ): void {
    let json: unknown = {};

    if (request?.responseText) {
      try {
        json = JSON.parse(request.responseText) as unknown;
      } catch {
        json = {};
      }
    }

    EventMgr.emit(
      this.name,
      json,
      this.otherData,
    );
    EventMgr.emit(
      NetEvent.ServerRequestSucess,
      json,
    );
  }
}
