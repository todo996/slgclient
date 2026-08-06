import { createGame, type GameRuntime } from "../game/game";
import { EventMgr } from "../legacy/events/event-manager";
import { HttpManager } from "../legacy/network/http/http-manager";
import { NetEvent } from "../legacy/network/socket/net-interface";
import {
  NetNodeState,
  NetNodeType,
  type NetworkStateSnapshot,
} from "../legacy/network/socket/net-node";
import { NetManager } from "../legacy/network/socket/net-manager";
import type { AppShell } from "../ui/create-app-shell";
import { loadRuntimeConfig } from "./runtime-config";

export class Bootstrap {
  private gameRuntime: GameRuntime | null = null;

  constructor(private readonly shell: AppShell) {}

  start(): void {
    const runtimeConfig = loadRuntimeConfig();

    this.shell.setConnectionStatus("Đang khởi tạo");
    this.shell.setEnvironment(
      runtimeConfig.httpUrl,
      runtimeConfig.wsUrl,
    );

    this.gameRuntime = createGame({
      parent: this.shell.gameCanvasId,
    });

    EventMgr.on(
      NetEvent.NetworkStateChanged,
      this.onNetworkStateChanged,
      this,
    );
    EventMgr.on(
      NetEvent.NetworkError,
      this.onNetworkError,
      this,
    );

    HttpManager.getInstance().setWebUrl(
      runtimeConfig.httpUrl,
    );

    NetManager.getInstance().connect({
      url: runtimeConfig.wsUrl,
      autoReconnect: 3,
      type: NetNodeType.BaseServer,
    });

    window.addEventListener(
      "beforeunload",
      this.destroy,
      { once: true },
    );
  }

  private readonly onNetworkStateChanged = (
    snapshot: NetworkStateSnapshot,
  ): void => {
    const labels: Record<NetNodeState, string> = {
      [NetNodeState.Closed]: "Đã ngắt kết nối",
      [NetNodeState.Connecting]: "Đang kết nối",
      [NetNodeState.Checking]: "Đang bắt tay",
      [NetNodeState.Working]: "Đã kết nối",
    };

    this.shell.setConnectionStatus(
      labels[snapshot.state],
    );
  };

  private readonly onNetworkError = (): void => {
    this.shell.setConnectionStatus(
      "Lỗi kết nối, đang thử lại",
    );
  };

  private readonly destroy = (): void => {
    EventMgr.targetOff(this);
    NetManager.getInstance().destroy();
    this.gameRuntime?.destroy();
    this.gameRuntime = null;
  };
}
