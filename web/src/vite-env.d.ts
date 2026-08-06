/// <reference types="vite/client" />

declare const __GAME_HTTP_URL__: string;
declare const __GAME_WS_URL__: string;

interface ImportMetaEnv {
  readonly VITE_GAME_HTTP_URL?: string;
  readonly VITE_GAME_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
