import { LogicEvent } from "../common/logic-event";
import { ServerConfig } from "../config/server-config";
import { EventMgr } from "../events/event-manager";
import { LoginCommand } from "../login/login-command";
import { NetManager } from "../network/socket/net-manager";
import { WarReportProxy, type WarReport } from "./war-report-proxy";

type ServerResponse = Readonly<{ code?: number; msg?: unknown }>;
type RawRecord = Record<string, unknown>;
const record = (value: unknown): RawRecord =>
  value !== null && typeof value === "object" ? value as RawRecord : {};

export class WarReportCommand {
  private static instance: WarReportCommand | null = null;
  readonly proxy = new WarReportProxy();

  static getInstance(): WarReportCommand {
    if (!WarReportCommand.instance) WarReportCommand.instance = new WarReportCommand();
    return WarReportCommand.instance;
  }

  static destroy(): void {
    WarReportCommand.instance?.onDestroy();
    WarReportCommand.instance = null;
  }

  private constructor() {
    EventMgr.on(ServerConfig.war_report, this.onReports, this);
    EventMgr.on(ServerConfig.war_reportPush, this.onReportPush, this);
    EventMgr.on(ServerConfig.war_read, this.onRead, this);
  }

  clearData(): void {
    this.proxy.clearData();
  }

  queryReports(): void {
    this.syncRole();
    void NetManager.getInstance().send({
      name: ServerConfig.war_report,
      msg: {},
    });
  }

  markRead(id = 0): void {
    void NetManager.getInstance().send({
      name: ServerConfig.war_read,
      msg: { id },
    });
  }

  private syncRole(): void {
    this.proxy.setRoleId(LoginCommand.getInstance().proxy.getRoleData()?.rid ?? 0);
  }

  private readonly onReports = (data: ServerResponse): void => {
    if (data.code !== 0) return;
    this.syncRole();
    this.proxy.updateReports(data.msg);
    this.emitUpdate();
  };

  private readonly onReportPush = (data: ServerResponse): void => {
    if (data.code !== 0) return;
    this.syncRole();
    const message = record(data.msg);
    const report = this.proxy.updateReport(message.report ?? data.msg);
    if (report) this.emitUpdate();
  };

  private readonly onRead = (data: ServerResponse): void => {
    if (data.code !== 0) return;
    this.syncRole();
    const message = record(data.msg);
    this.proxy.markRead(Number(message.id ?? 0), true);
    this.emitUpdate();
  };

  private emitUpdate(): void {
    EventMgr.emit(LogicEvent.updateWarReport, this.proxy.getReports());
  }

  private onDestroy(): void {
    EventMgr.targetOff(this);
    this.proxy.clearData();
  }
}

export type { WarReport };
