export type RuntimeConfig = Readonly<{
  httpUrl: string;
  wsUrl: string;
  demoMode: boolean;
}>;

function readUrl(
  value: string | undefined,
  fallback: string,
  protocols: readonly string[],
): string {
  const rawValue = value?.trim() || fallback;
  const parsed = new URL(rawValue);

  if (!protocols.includes(parsed.protocol)) {
    throw new Error(
      `Protocol không hợp lệ cho ${rawValue}. Chấp nhận: ${protocols.join(", ")}`,
    );
  }

  return parsed.toString().replace(/\/$/, "");
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function readDemoMode(): boolean {
  const query = typeof window === "undefined"
    ? null
    : new URLSearchParams(window.location.search).get("demo");
  return readBoolean(query ?? import.meta.env.VITE_DEMO_MODE, true);
}

export function loadRuntimeConfig(): RuntimeConfig {
  return {
    httpUrl: readUrl(
      import.meta.env.VITE_GAME_HTTP_URL || __GAME_HTTP_URL__,
      "http://localhost:8088",
      ["http:", "https:"],
    ),
    wsUrl: readUrl(
      import.meta.env.VITE_GAME_WS_URL || __GAME_WS_URL__,
      "ws://localhost:8088",
      ["ws:", "wss:"],
    ),
    demoMode: readDemoMode(),
  };
}
