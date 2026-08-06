export type RuntimeConfig = Readonly<{
  httpUrl: string;
  wsUrl: string;
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
  };
}
