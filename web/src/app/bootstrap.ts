import { createGame, type GameRuntime } from "../game/game";
import type { AppShell } from "../ui/create-app-shell";
import { loadRuntimeConfig } from "./runtime-config";

export class Bootstrap {
  private gameRuntime: GameRuntime | null = null;

  constructor(private readonly shell: AppShell) {}

  start(): void {
    const runtimeConfig = loadRuntimeConfig();

    this.shell.setConnectionStatus("Chưa kết nối máy chủ");
    this.shell.setEnvironment(runtimeConfig.httpUrl, runtimeConfig.wsUrl);

    this.gameRuntime = createGame({
      parent: this.shell.gameCanvasId,
    });

    window.addEventListener("beforeunload", this.destroy, { once: true });
  }

  private readonly destroy = (): void => {
    this.gameRuntime?.destroy();
    this.gameRuntime = null;
  };
}
