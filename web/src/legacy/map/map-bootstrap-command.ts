import { LogicEvent } from "../common/logic-event";
import { ServerConfig } from "../config/server-config";
import { EventMgr } from "../events/event-manager";
import { NetManager } from "../network/socket/net-manager";

type ServerResponse = {
  code?: number;
  msg?: any;
};

export type MapBootstrapSnapshot = Readonly<{
  nationMapConfig: unknown;
  roleProperty: unknown;
  positionTags: unknown;
}>;

export class MapBootstrapCommand {
  private static instance: MapBootstrapCommand | null = null;

  private nationMapConfig: unknown = null;
  private roleProperty: unknown = null;
  private positionTags: unknown = null;

  static getInstance(): MapBootstrapCommand {
    if (!MapBootstrapCommand.instance) {
      MapBootstrapCommand.instance = new MapBootstrapCommand();
    }

    return MapBootstrapCommand.instance;
  }

  static destroy(): void {
    MapBootstrapCommand.instance?.onDestroy();
    MapBootstrapCommand.instance = null;
  }

  private constructor() {
    EventMgr.on(
      ServerConfig.nationMap_config,
      this.onNationMapConfig,
      this,
    );
    EventMgr.on(
      ServerConfig.role_myProperty,
      this.onRoleMyProperty,
      this,
    );
    EventMgr.on(
      ServerConfig.role_posTagList,
      this.onPositionTags,
      this,
    );
  }

  enterMap(): void {
    if (!this.nationMapConfig) {
      NetManager.getInstance().send({
        name: ServerConfig.nationMap_config,
        msg: {},
      });
      return;
    }

    if (!this.roleProperty) {
      NetManager.getInstance().send({
        name: ServerConfig.role_myProperty,
        msg: {},
      });
      return;
    }

    EventMgr.emit(LogicEvent.enterMap, this.getSnapshot());
  }

  clearData(): void {
    this.nationMapConfig = null;
    this.roleProperty = null;
    this.positionTags = null;
  }

  getSnapshot(): MapBootstrapSnapshot {
    return {
      nationMapConfig: this.nationMapConfig,
      roleProperty: this.roleProperty,
      positionTags: this.positionTags,
    };
  }

  private readonly onNationMapConfig = (
    data: ServerResponse,
  ): void => {
    if (data.code !== 0) return;

    this.nationMapConfig = data.msg ?? {};
    this.enterMap();
  };

  private readonly onRoleMyProperty = (
    data: ServerResponse,
  ): void => {
    if (data.code !== 0) return;

    this.roleProperty = data.msg ?? {};
    NetManager.getInstance().send({
      name: ServerConfig.role_posTagList,
      msg: {},
    });
    this.enterMap();
  };

  private readonly onPositionTags = (
    data: ServerResponse,
  ): void => {
    if (data.code === 0) {
      this.positionTags = data.msg ?? {};
      EventMgr.emit(LogicEvent.updateTag, this.positionTags);
    }
  };

  private onDestroy(): void {
    EventMgr.targetOff(this);
    this.clearData();
  }
}
