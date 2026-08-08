import CryptoJS from "crypto-js";
import { gzip, ungzip } from "pako";
import type { OutgoingEnvelope } from "./net-interface";

export class SocketCodec {
  private key = "";

  setKey(key: string): void {
    this.key = key;
  }

  clearKey(): void {
    this.key = "";
  }

  hasKey(): boolean {
    return this.key.length > 0;
  }

  pack(message: OutgoingEnvelope): Uint8Array {
    const json = JSON.stringify(message);
    const payload = this.hasKey()
      ? this.encrypt(json)
      : json;

    return gzip(payload, { level: 9 });
  }

  unpack(data: Uint8Array): string {
    const message = ungzip(data, { to: "string" });

    if (!this.hasKey()) {
      return message;
    }

    return this.decrypt(message);
  }

  private encrypt(data: string): string {
    const key = CryptoJS.enc.Utf8.parse(this.key);
    const source = CryptoJS.enc.Utf8.parse(data);
    const encrypted = CryptoJS.AES.encrypt(source, key, {
      iv: key,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.ZeroPadding,
    });

    return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
  }

  private decrypt(message: string): string {
    const key = CryptoJS.enc.Utf8.parse(this.key);
    const ciphertext = CryptoJS.enc.Hex.parse(message);
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext,
    });

    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv: key,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.ZeroPadding,
    });

    return decrypted
      .toString(CryptoJS.enc.Utf8)
      .replaceAll("\u0000", "");
  }
}
