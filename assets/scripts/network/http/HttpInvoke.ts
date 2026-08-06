import { NetEvent } from "../socket/NetInterface";
import { EventMgr } from '../../utils/EventMgr';

export enum HttpInvokeType {
    GET,
    POST,
}

export class HttpInvoke {
    protected _receiveTime: number = 15000;
    protected _name: string = "";
    protected _otherData: any = null;

    public init(name: string, otherData: any = null): void {
        this._name = name;
        this._otherData = otherData;
    }

    private onComplete(data: XMLHttpRequest | null): void {
        let json: any = {};
        if (data?.responseText) {
            try {
                json = JSON.parse(data.responseText);
            } catch (_error) {
                json = {};
            }
        }

        EventMgr.emit(this._name, json, this._otherData);
        EventMgr.emit(NetEvent.ServerRequestSucess, json);
    }

    public doSend(url: string, params: string, type: HttpInvokeType): Promise<any> {
        const xhr = new XMLHttpRequest();
        xhr.timeout = this._receiveTime;

        return new Promise(resolve => {
            xhr.onreadystatechange = () => {
                if (xhr.readyState !== XMLHttpRequest.DONE) {
                    return;
                }

                this.onComplete(xhr.status >= 200 && xhr.status < 400 ? xhr : null);
                resolve(xhr);
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
                xhr.open("GET", `${url}${separator}${params}`, true);
                xhr.setRequestHeader("Accept", "application/json");
                xhr.send();
                return;
            }

            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
            xhr.setRequestHeader("Accept", "application/json");
            xhr.send(params);
        });
    }
}
