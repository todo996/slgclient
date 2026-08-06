import { LogicEvent } from "../common/logic-event";
import { ServerConfig } from "../config/server-config";
import { EventMgr } from "../events/event-manager";
import { NetManager } from "../network/socket/net-manager";
import { GeneralProxy, type GeneralData } from "./general-proxy";

type ServerResponse = Readonly<{
  code?: number;
  msg?: unknown;
}>;

type RawRecord = Record<string, unknown>;

const record = (value: unknown): RawRecord =>
  value !== null && typeof value === "object" ? value as RawRecord : {};

const numbers = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.map(Number).filter(Number.isFinite)
    : [];

export class GeneralCommand {
  private static instance: GeneralCommand | null = null;
  private configPromise: Promise<void> | null = null;
  readonly proxy = new GeneralProxy();

  static getInstance(): GeneralCommand {
    if (!GeneralCommand.instance) GeneralCommand.instance = new GeneralCommand();
    return GeneralCommand.instance;
  }

  static destroy(): void {
    GeneralCommand.instance?.onDestroy();
    GeneralCommand.instance = null;
  }

  private constructor() {
    EventMgr.on(ServerConfig.general_myGenerals, this.onMyGenerals, this);
    EventMgr.on(ServerConfig.general_push, this.onGeneralPush, this);
    EventMgr.on(ServerConfig.general_drawGeneral, this.onDrawGenerals, this);
    EventMgr.on(ServerConfig.general_composeGeneral, this.onComposeGeneral, this);
    EventMgr.on(ServerConfig.general_addPrGeneral, this.onAddPrGeneral, this);
    EventMgr.on(ServerConfig.general_convert, this.onGeneralConvert, this);
    EventMgr.on(ServerConfig.general_upSkill, this.onSkillMutation, this);
    EventMgr.on(ServerConfig.general_downSkill, this.onSkillMutation, this);
    EventMgr.on(ServerConfig.general_lvSkill, this.onSkillMutation, this);
  }

  ensureConfig(): Promise<void> {
    if (!this.configPromise) {
      this.configPromise = Promise.all([
        this.fetchJson("/game-assets/config/general/general.json"),
        this.fetchJson("/game-assets/config/general/general_basic.json"),
        this.fetchJson("/game-assets/config/basic.json"),
      ]).then(([general, generalBasic, basic]) => {
        this.proxy.initGeneralConfig(general, generalBasic, basic);
      }).catch((error: unknown) => {
        this.configPromise = null;
        throw error;
      });
    }
    return this.configPromise;
  }

  clearData(): void {
    this.proxy.clearData();
  }

  queryMyGenerals(): void {
    void NetManager.getInstance().send({
      name: ServerConfig.general_myGenerals,
      msg: {},
    });
  }

  drawGenerals(drawTimes = 1): void {
    void NetManager.getInstance().send({
      name: ServerConfig.general_drawGeneral,
      msg: { drawTimes },
    });
  }

  composeGeneral(compId: number, gIds: readonly number[]): void {
    void NetManager.getInstance().send({
      name: ServerConfig.general_composeGeneral,
      msg: { compId, gIds: [...gIds] },
    });
  }

  addPrGeneral(
    compId: number,
    forceAdd: number,
    strategyAdd: number,
    defenseAdd: number,
    speedAdd: number,
    destroyAdd: number,
  ): void {
    void NetManager.getInstance().send({
      name: ServerConfig.general_addPrGeneral,
      msg: {
        compId,
        forceAdd,
        strategyAdd,
        defenseAdd,
        speedAdd,
        destroyAdd,
      },
    });
  }

  convert(gIds: readonly number[]): void {
    void NetManager.getInstance().send({
      name: ServerConfig.general_convert,
      msg: { gIds: [...gIds] },
    });
  }

  upSkill(gId: number, cfgId: number, pos: number): void {
    void NetManager.getInstance().send({
      name: ServerConfig.general_upSkill,
      msg: { gId, cfgId, pos: Number(pos) },
    });
  }

  downSkill(gId: number, cfgId: number, pos: number): void {
    void NetManager.getInstance().send({
      name: ServerConfig.general_downSkill,
      msg: { gId, cfgId, pos: Number(pos) },
    });
  }

  levelSkill(gId: number, pos: number): void {
    void NetManager.getInstance().send({
      name: ServerConfig.general_lvSkill,
      msg: { gId, pos: Number(pos) },
    });
  }

  private readonly onMyGenerals = (data: ServerResponse): void => {
    if (data.code !== 0) return;
    const message = record(data.msg);
    this.proxy.updateMyGenerals(message.generals ?? []);
    this.emitGeneralListUpdate();
  };

  private readonly onGeneralPush = (data: ServerResponse): void => {
    if (data.code !== 0) return;
    const message = record(data.msg);
    const general = record(message.general).id ? message.general : message;
    const updated = this.proxy.updateGeneral(general);
    this.emitGeneralListUpdate();
    EventMgr.emit(LogicEvent.updateGeneral, updated ?? general);
  };

  private readonly onDrawGenerals = (data: ServerResponse): void => {
    EventMgr.emit(LogicEvent.hideWaiting);
    if (data.code !== 0) return;
    const message = record(data.msg);
    const updated = this.proxy.updateMyGenerals(message.generals ?? []);
    this.emitGeneralListUpdate();
    EventMgr.emit(LogicEvent.openDrawResult, updated);
  };

  private readonly onComposeGeneral = (data: ServerResponse): void => {
    if (data.code !== 0) return;
    const message = record(data.msg);
    const updated = this.proxy.updateMyGenerals(message.generals ?? []);
    this.emitGeneralListUpdate();
    const last = updated.at(-1);
    if (last) EventMgr.emit(LogicEvent.updateOneGenerals, last);
  };

  private readonly onAddPrGeneral = (data: ServerResponse): void => {
    if (data.code !== 0) return;
    const message = record(data.msg);
    const updated = this.proxy.updateGeneral(message.general ?? message);
    this.emitGeneralListUpdate();
    if (updated) {
      EventMgr.emit(LogicEvent.updateOneGenerals, updated);
      EventMgr.emit(LogicEvent.updateGeneral, updated);
    }
  };

  private readonly onGeneralConvert = (data: ServerResponse): void => {
    if (data.code !== 0) return;
    const message = record(data.msg);
    const ids = numbers(message.gIds);
    this.proxy.removeMyGenerals(ids);
    this.emitGeneralListUpdate();
    EventMgr.emit(LogicEvent.generalConvert, message);
  };

  private readonly onSkillMutation = (data: ServerResponse): void => {
    if (data.code !== 0) return;
    const message = record(data.msg);
    const updated = this.proxy.updateGeneral(message.general ?? message);
    if (updated) {
      this.emitGeneralListUpdate();
      EventMgr.emit(LogicEvent.updateOneGenerals, updated);
      EventMgr.emit(LogicEvent.updateGeneral, updated);
    }
  };

  private emitGeneralListUpdate(): void {
    EventMgr.emit(LogicEvent.updateGeneralList);
    EventMgr.emit(LogicEvent.updateMyGenerals);
  }

  private async fetchJson(url: string): Promise<unknown> {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) throw new Error(`Không tải được cấu hình võ tướng: ${url}`);
    return response.json() as Promise<unknown>;
  }

  private onDestroy(): void {
    EventMgr.targetOff(this);
    this.proxy.clearData();
    this.configPromise = null;
  }
}

export type { GeneralData };
