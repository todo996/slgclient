import { LogicEvent } from "../../legacy/common/logic-event";
import { EventMgr } from "../../legacy/events/event-manager";
import { GeneralCommand } from "../../legacy/general/general-command";
import { LoginCommand } from "../../legacy/login/login-command";
import { SkillCommand } from "../../legacy/skill/skill-command";
import { WarReportCommand } from "../../legacy/war/war-report-command";
import type { WarReport } from "../../legacy/war/war-report-proxy";
import { UIManager } from "../ui-manager";
import { createWarReportDetailPanel, createWarReportPanel } from "./war-report-panels";

export class WarReportFeature {
  private readonly ui: UIManager;
  private readonly command = WarReportCommand.getInstance();
  private readonly panels = new Map<string, HTMLElement>();
  private opening = false;

  constructor(root: HTMLElement) {
    this.ui = new UIManager(root);
    EventMgr.on(LogicEvent.openWarReport, this.openReports, this);
    EventMgr.on(LogicEvent.closeReport, this.closeAll, this);
    EventMgr.on(LogicEvent.enterLogin, this.reset, this);
  }

  destroy(): void {
    EventMgr.targetOff(this);
    this.closeAll();
    WarReportCommand.destroy();
  }

  private readonly openReports = async (): Promise<void> => {
    if (this.opening || this.panels.has("list")) return;
    this.opening = true;
    try {
      await Promise.all([
        GeneralCommand.getInstance().ensureConfig(),
        SkillCommand.getInstance().ensureConfig(),
      ]);
      const roleId = LoginCommand.getInstance().proxy.getRoleData()?.rid ?? 0;
      this.closePanel("detail");
      this.openPanel("list", createWarReportPanel(
        this.command,
        roleId,
        this.openDetail,
        () => this.closePanel("list"),
        this.locate,
      ));
      this.command.queryReports();
    } catch (error) {
      EventMgr.emit(
        LogicEvent.showToast,
        error instanceof Error ? error.message : "Không thể mở chiến báo",
      );
    } finally {
      this.opening = false;
    }
  };

  private readonly openDetail = (report: WarReport): void => {
    const roleId = LoginCommand.getInstance().proxy.getRoleData()?.rid ?? 0;
    this.closePanel("detail");
    this.openPanel("detail", createWarReportDetailPanel(
      report,
      roleId,
      () => this.closePanel("detail"),
      this.locate,
    ));
  };

  private readonly locate = (report: WarReport): void => {
    this.closeAll();
    EventMgr.emit(LogicEvent.scrollToMap, report.x, report.y);
  };

  private readonly reset = (): void => {
    this.command.clearData();
    this.closeAll();
  };

  private openPanel(key: string, panel: HTMLElement): void {
    this.panels.set(key, panel);
    this.ui.open(panel);
  }

  private closePanel(key: string): void {
    const panel = this.panels.get(key);
    if (!panel) return;
    this.panels.delete(key);
    this.ui.close(panel);
  }

  private readonly closeAll = (): void => {
    this.panels.clear();
    this.ui.closeAll();
  };
}
