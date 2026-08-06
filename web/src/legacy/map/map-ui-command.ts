import { LogicEvent } from "../common/logic-event.ts";
import { ServerConfig } from "../config/server-config.ts";
import { EventMgr } from "../events/event-manager.ts";
import { LoginCommand } from "../login/login-command.ts";
import { NetManager } from "../network/socket/net-manager.ts";

type ServerResponse = Readonly<{
  code?: number;
  msg?: unknown;
}>;

export class MapUiCommand {
  private static instance: MapUiCommand | null = null;

  static getInstance(): MapUiCommand {
    if (!MapUiCommand.instance) MapUiCommand.instance = new MapUiCommand();
    return MapUiCommand.instance;
  }

  static destroy(): void {
    MapUiCommand.instance?.onDestroy();
    MapUiCommand.instance = null;
  }

  private constructor() {
    EventMgr.on(ServerConfig.role_myRoleRes, this.onRoleResources, this);
    EventMgr.on(ServerConfig.roleRes_push, this.onRoleResources, this);
  }

  queryRoleResources(): void {
    NetManager.getInstance().send({
      name: ServerConfig.role_myRoleRes,
      msg: {},
    });
  }

  private readonly onRoleResources = (data: ServerResponse): void => {
    if (data.code !== 0) return;
    const message = data.msg as Record<string, unknown> | undefined;
    const resources = message?.role_res ?? message ?? {};
    LoginCommand.getInstance().proxy.setRoleResData(resources);
    EventMgr.emit(LogicEvent.updateMyRoleRes);
  };

  private onDestroy(): void {
    EventMgr.targetOff(this);
  }
}
