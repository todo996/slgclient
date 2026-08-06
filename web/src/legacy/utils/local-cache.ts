type CacheStore = Record<string, unknown>;

export class LocalCache {
  static readonly userListKey = "userListKey";

  static setPersonMemory(key: string, value: unknown): void {
    if (!key) return;

    const store = LocalCache.getListForJson();
    store[key] = value;
    window.localStorage.setItem(
      LocalCache.userListKey,
      JSON.stringify(store),
    );
  }

  static getPersonMemory<T>(key: string, defaultValue: T): T {
    if (!key) return defaultValue;

    const store = LocalCache.getListForJson();
    return Object.prototype.hasOwnProperty.call(store, key)
      ? (store[key] as T)
      : defaultValue;
  }

  static getListForJson(): CacheStore {
    const raw = window.localStorage.getItem(
      LocalCache.userListKey,
    );

    if (!raw) return {};

    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === "object"
        ? (parsed as CacheStore)
        : {};
    } catch {
      window.localStorage.removeItem(
        LocalCache.userListKey,
      );
      return {};
    }
  }

  static getUuid(): string {
    return LocalCache.getPersonMemory(
      "deviceuuid",
      "",
    );
  }

  static setUuid(uuid: string): void {
    LocalCache.setPersonMemory("deviceuuid", uuid);
  }

  static setLoginValidation(data: { username: string }): void {
    LocalCache.setPersonMemory("loginvalidation", {
      username: data.username || "",
    });
  }

  static getLoginValidation(): { username: string } | null {
    const data = LocalCache.getPersonMemory<unknown>(
      "loginvalidation",
      null,
    );

    if (!data || typeof data !== "object") {
      return null;
    }

    const username = (data as { username?: unknown }).username;
    const sanitized = {
      username: typeof username === "string" ? username : "",
    };

    LocalCache.setLoginValidation(sanitized);
    return sanitized;
  }
}
