/** Cấu hình kết nối giữa Cocos Client và backend. */

type RuntimeGameConfig = {
    serverUrl?: string;
    webUrl?: string;
    locale?: string;
};

declare global {
    interface Window {
        __TAM_QUOC_CONFIG__?: RuntimeGameConfig;
    }
}

const runtimeConfig: RuntimeGameConfig =
    typeof window !== 'undefined' && window.__TAM_QUOC_CONFIG__
        ? window.__TAM_QUOC_CONFIG__
        : {};

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const isLocalWeb =
    typeof window === 'undefined'
    || window.location.hostname === 'localhost'
    || window.location.hostname === '127.0.0.1';

const defaultServerUrl = isLocalWeb
    ? 'ws://127.0.0.1:8004'
    : 'wss://slgserver-production.up.railway.app';

const defaultWebUrl = isLocalWeb
    ? 'http://127.0.0.1:8088'
    : 'https://slgserver-production.up.railway.app';

const GameConfig = {
    /** WebSocket: localhost khi phát triển, Railway khi chạy trên web production. */
    serverUrl: trimTrailingSlash(runtimeConfig.serverUrl || defaultServerUrl),

    /** HTTP API: localhost khi phát triển, Railway khi chạy trên web production. */
    webUrl: trimTrailingSlash(runtimeConfig.webUrl || defaultWebUrl),

    /** Ngôn ngữ mặc định của bản Việt hoá. */
    locale: runtimeConfig.locale || 'vi-VN',
};

export { GameConfig };
export type { RuntimeGameConfig };
