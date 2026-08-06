import { sys } from "cc";

type CacheStore = Record<string, any>;

export class LocalCache {
    public static userListKey = "userListKey";

    public static setPersonMemory(key: string, value: any): void {
        if (!key) {
            return;
        }

        const store = LocalCache.getListForJson();
        store[key] = value;
        sys.localStorage.setItem(LocalCache.userListKey, JSON.stringify(store));
    }

    public static getPersonMemory(key: string, defaultValue: any): any {
        if (!key) {
            return defaultValue;
        }

        const store = LocalCache.getListForJson();
        return Object.prototype.hasOwnProperty.call(store, key)
            ? store[key]
            : defaultValue;
    }

    public static getListForJson(): CacheStore {
        const raw = sys.localStorage.getItem(LocalCache.userListKey);
        if (!raw) {
            return {};
        }

        try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch (_error) {
            sys.localStorage.removeItem(LocalCache.userListKey);
            return {};
        }
    }

    public static getUuid(): string {
        return LocalCache.getPersonMemory("deviceuuid", "") || "";
    }

    public static setUuid(uuid: string): void {
        LocalCache.setPersonMemory("deviceuuid", uuid);
    }

    public static setLoginValidation(data: { username: string }): void {
        LocalCache.setPersonMemory("loginvalidation", {
            username: data?.username || "",
        });
    }

    public static getLoginValidation(): { username: string } | null {
        const data = LocalCache.getPersonMemory("loginvalidation", null);
        if (!data || typeof data !== "object") {
            return null;
        }

        // Phiên bản cũ từng lưu cả mật khẩu. Ghi lại dữ liệu đã làm sạch để
        // trường password bị xoá khỏi localStorage ngay lần chạy đầu tiên.
        const sanitized = {
            username: typeof data.username === "string" ? data.username : "",
        };
        LocalCache.setLoginValidation(sanitized);
        return sanitized;
    }

    public static getMusic(): boolean {
        return Boolean(LocalCache.getPersonMemory("music", false));
    }

    public static setMusic(state: boolean): void {
        LocalCache.setPersonMemory("music", state);
    }

    public static getSound(): boolean {
        return Boolean(LocalCache.getPersonMemory("sound", false));
    }

    public static setSound(state: boolean): void {
        LocalCache.setPersonMemory("sound", state);
    }
}
