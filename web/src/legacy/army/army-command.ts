import { LogicEvent } from "../common/logic-event";
import { ServerConfig } from "../config/server-config";
import { EventMgr } from "../events/event-manager";
import { GeneralCommand } from "../general/general-command";
import { getGeneralAttributeValue, type GeneralData } from "../general/general-proxy";
import { LoginCommand } from "../login/login-command";
import { NetManager } from "../network/socket/net-manager";
import { ArmyCmd, ArmyProxy, isArmyConscriptComplete, type ArmyData } from "./army-proxy";

type Response = Readonly<{ code?: number; msg?: unknown }>;
type RawRecord = Record<string, unknown>;
const record = (value: unknown): RawRecord => value !== null && typeof value === "object" ? value as RawRecord : {};

export class ArmyCommand {
  private static instance: ArmyCommand | null = null;
  private timer = 0;
  readonly proxy = new ArmyProxy();

  static getInstance(): ArmyCommand {
    if (!ArmyCommand.instance) ArmyCommand.instance = new ArmyCommand();
    return ArmyCommand.instance;
  }
  static destroy(): void {
    ArmyCommand.instance?.onDestroy();
    ArmyCommand.instance = null;
  }

  private constructor() {
    EventMgr.on(ServerConfig.army_myList, this.onArmyList, this);
    EventMgr.on(ServerConfig.army_myOne, this.onArmyOne, this);
    EventMgr.on(ServerConfig.army_dispose, this.onArmyMutation, this);
    EventMgr.on(ServerConfig.army_conscript, this.onConscript, this);
    EventMgr.on(ServerConfig.army_assign, this.onArmyMutation, this);
    EventMgr.on(ServerConfig.army_push, this.onArmyPush, this);
    EventMgr.on(ServerConfig.nationMap_scanBlock, this.onScanBlock, this);
    this.timer = window.setInterval(this.refreshCompletedConscription, 1000);
  }

  clearData(): void { this.proxy.clearData(); }
  updateMyProperty(value: unknown): readonly ArmyData[] {
    const raw = record(value);
    const armies = this.proxy.updateArmiesNoCity(raw.armys ?? value);
    if (armies.length) EventMgr.emit(LogicEvent.updateArmyList, armies);
    return armies;
  }
  queryArmyList(cityId: number): void {
    void NetManager.getInstance().send({ name: ServerConfig.army_myList, msg: { cityId } });
  }
  queryArmyOne(cityId: number, order: number): void {
    void NetManager.getInstance().send({ name: ServerConfig.army_myOne, msg: { cityId, order } });
  }
  disposeGeneral(cityId: number, generalId: number, order: number, position: number, otherData: unknown = null): void {
    void NetManager.getInstance().send({
      name: ServerConfig.army_dispose,
      msg: { cityId, generalId, order, position },
    }, otherData);
  }
  conscript(armyId: number, cnts: readonly number[], otherData: unknown = null): void {
    void NetManager.getInstance().send({
      name: ServerConfig.army_conscript,
      msg: { armyId, cnts: [...cnts] },
    }, otherData);
  }
  assign(armyId: number, cmd: number, x: number, y: number, otherData: unknown = null): void {
    void NetManager.getInstance().send({
      name: ServerConfig.army_assign,
      msg: { armyId, cmd, x, y },
    }, otherData);
  }

  getArmyGenerals(army: ArmyData): readonly (GeneralData | null)[] {
    return army.generals.map((id) => id > 0 ? GeneralCommand.getInstance().proxy.getMyGeneral(id) : null);
  }
  getArmyPhysicalPower(army: ArmyData): number {
    return this.getArmyPhysicalPowerByGenerals(this.getArmyGenerals(army));
  }
  getArmyPhysicalPowerByGenerals(generals: readonly (GeneralData | null)[]): number {
    const values = generals.filter((item): item is GeneralData => item !== null).map((item) => item.physicalPower);
    return values.length ? Math.min(...values) : 100;
  }
  getArmyCurrentSoldiers(army: ArmyData): number { return army.soldiers.reduce((sum, value) => sum + value, 0); }
  getArmyTotalSoldiers(generals: readonly (GeneralData | null)[]): number {
    return generals.reduce((sum, general) => sum + (general ? GeneralCommand.getInstance().proxy.getGeneralLevelCfg(general.level)?.soldiers ?? 0 : 0), 0);
  }
  getArmySpeed(generals: readonly (GeneralData | null)[]): number {
    const values = generals.filter((item): item is GeneralData => item !== null).map((item) => getGeneralAttributeValue(item, "speed"));
    return values.length ? Math.min(...values) : 0;
  }
  getArmyDestroy(generals: readonly (GeneralData | null)[]): number {
    return generals.reduce((sum, item) => sum + (item ? getGeneralAttributeValue(item, "destroy") : 0), 0);
  }
  getArmyCamp(generals: readonly (GeneralData | null)[]): number {
    const active = generals.filter((item): item is GeneralData => item !== null);
    if (active.length < 3) return 0;
    return active.every((item) => item.config.camp === active[0]!.config.camp) ? active[0]!.config.camp : 0;
  }
  getArmyStateDescription(army: ArmyData): string {
    if (army.state > 0) return army.cmd === ArmyCmd.Return ? "[Rút lui]" : "[Hành quân]";
    return ({
      [ArmyCmd.Idle]: "[Chờ lệnh]",
      [ArmyCmd.Reclaim]: "[Đồn điền]",
      [ArmyCmd.Conscript]: "[Chiêu mộ]",
      [ArmyCmd.Garrison]: "[Đồn trú]",
    } as Record<number, string>)[army.cmd] ?? "[Dừng lại]";
  }

  private readonly onArmyList = (data: Response): void => {
    if (data.code !== 0) return;
    const message = record(data.msg);
    const list = this.proxy.updateArmies(Number(message.cityId ?? 0), message.armys ?? []);
    EventMgr.emit(LogicEvent.updateArmyList, list);
  };
  private readonly onArmyOne = (data: Response): void => {
    if (data.code !== 0) return;
    const message = record(data.msg);
    const army = this.proxy.updateArmy(message.army ?? message);
    if (!army) return;
    EventMgr.emit(LogicEvent.updateArmyList, this.proxy.getArmyList(army.cityId));
    EventMgr.emit(LogicEvent.updateArmy, army);
  };
  private readonly onArmyMutation = (data: Response): void => {
    if (data.code !== 0) return;
    const message = record(data.msg);
    const army = this.proxy.updateArmy(message.army ?? message);
    if (army) {
      EventMgr.emit(LogicEvent.updateArmy, army);
      EventMgr.emit(LogicEvent.updateArmyList, this.proxy.getArmyList(army.cityId));
    }
  };
  private readonly onConscript = (data: Response): void => {
    if (data.code !== 0) return;
    const message = record(data.msg);
    if (message.role_res) {
      LoginCommand.getInstance().proxy.setRoleResData(message.role_res);
      EventMgr.emit(LogicEvent.updateMyRoleRes);
    }
    this.onArmyMutation(data);
  };
  private readonly onArmyPush = (data: Response): void => {
    if (data.code !== 0) return;
    const message = record(data.msg);
    const army = this.proxy.updateArmy(message.army ?? message);
    if (army) EventMgr.emit(LogicEvent.updateArmy, army);
  };
  private readonly onScanBlock = (data: Response): void => {
    if (data.code !== 0) return;
    const message = record(data.msg);
    for (const army of this.proxy.updateArmiesNoCity(message.armys ?? [])) {
      EventMgr.emit(LogicEvent.updateArmy, army);
    }
  };
  private readonly refreshCompletedConscription = (): void => {
    for (const army of this.proxy.getAllArmies()) {
      if (isArmyConscriptComplete(army)) this.queryArmyOne(army.cityId, army.order);
    }
  };
  private onDestroy(): void {
    EventMgr.targetOff(this);
    window.clearInterval(this.timer);
    this.proxy.clearData();
  }
}
