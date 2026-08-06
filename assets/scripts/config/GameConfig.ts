/** Cấu hình kết nối giữa Cocos Client và backend Railway. */

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

const GameConfig = {
    /** WebSocket public của gate-service trên Railway. */
    serverUrl: trimTrailingSlash(runtimeConfig.serverUrl || 'ws://127.0.0.1:8004'),

    /** HTTPS public của http-service trên Railway. */
    webUrl: trimTrailingSlash(runtimeConfig.webUrl || 'http://127.0.0.1:8088'),

    /** Ngôn ngữ mặc định của bản Việt hoá. */
    locale: runtimeConfig.locale || 'vi-VN',
};

export { GameConfig };
export type { RuntimeGameConfig };
