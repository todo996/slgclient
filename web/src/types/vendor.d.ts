declare module "crypto-js" {
  type Encoder = Readonly<{
    parse: (value: string) => WordArray;
    stringify: (value: WordArray) => string;
  }>;

  type WordArray = Readonly<{
    toString: (encoder?: Encoder) => string;
  }>;

  type CipherParams = Readonly<{
    ciphertext: WordArray;
  }>;

  type CipherOptions = Readonly<{
    iv: WordArray;
    mode: unknown;
    padding: unknown;
  }>;

  const CryptoJS: {
    enc: {
      Utf8: Encoder;
      Hex: Encoder;
    };
    lib: {
      CipherParams: {
        create: (params: { ciphertext: WordArray }) => CipherParams;
      };
    };
    AES: {
      encrypt: (
        data: WordArray,
        key: WordArray,
        options: CipherOptions,
      ) => CipherParams;
      decrypt: (
        data: CipherParams,
        key: WordArray,
        options: CipherOptions,
      ) => WordArray;
    };
    mode: {
      CBC: unknown;
    };
    pad: {
      ZeroPadding: unknown;
    };
  };

  export default CryptoJS;
}

declare module "pako" {
  export function gzip(
    data: string | Uint8Array,
    options?: { level?: number },
  ): Uint8Array;

  export function ungzip(
    data: Uint8Array,
    options: { to: "string" },
  ): string;
}
