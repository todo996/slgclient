import {
  HttpInvoke,
  HttpInvokeType,
} from "./http-invoke";

export class HttpManager {
  private static instance: HttpManager | null = null;
  private url = "";

  static getInstance(): HttpManager {
    if (!this.instance) {
      this.instance = new HttpManager();
    }

    return this.instance;
  }

  setWebUrl(url: string): void {
    this.url = url.replace(/\/$/, "");
  }

  doGet(
    name: string,
    apiUrl: string,
    params: string,
    otherData: unknown = null,
  ): Promise<XMLHttpRequest | null> {
    const invoke = new HttpInvoke();
    invoke.init(name, otherData);

    return invoke.doSend(
      this.resolveUrl(apiUrl),
      params,
      HttpInvokeType.GET,
    );
  }

  doPost(
    name: string,
    apiUrl: string,
    params: string,
    otherData: unknown = null,
  ): Promise<XMLHttpRequest | null> {
    const invoke = new HttpInvoke();
    invoke.init(name, otherData);

    return invoke.doSend(
      this.resolveUrl(apiUrl),
      params,
      HttpInvokeType.POST,
    );
  }

  private resolveUrl(apiUrl: string): string {
    if (!this.url) {
      throw new Error(
        "HttpManager chưa được cấu hình web URL",
      );
    }

    const normalizedPath = apiUrl.startsWith("/")
      ? apiUrl
      : `/${apiUrl}`;

    return `${this.url}${normalizedPath}`;
  }
}
