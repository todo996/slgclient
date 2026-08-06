import { LogicEvent } from "../../legacy/common/logic-event";
import { EventMgr } from "../../legacy/events/event-manager";
import { GeneralCommand } from "../../legacy/general/general-command";
import type { GeneralConfig, GeneralData } from "../../legacy/general/general-proxy";
import { SkillCommand } from "../../legacy/skill/skill-command";
import type { SkillData } from "../../legacy/skill/skill-proxy";
import { UIManager } from "../ui-manager";
import { createGeneralConvertPanel } from "./general-convert-panel";
import { createGeneralDetailPanel } from "./general-detail-panel";
import { createGeneralDrawPanel, createDrawResultPanel } from "./general-draw-panel";
import { createGeneralListPanel } from "./general-list-panel";
import { createGeneralRosterPanel } from "./general-roster-panel";
import { createSkillInfoPanel, createSkillListPanel } from "./skill-panels";

export class GeneralFeature {
  private readonly ui: UIManager;
  private readonly generalCommand = GeneralCommand.getInstance();
  private readonly skillCommand = SkillCommand.getInstance();
  private readonly panels = new Map<string, HTMLElement>();
  private opening = false;

  constructor(root: HTMLElement) {
    this.ui = new UIManager(root);
    EventMgr.on(LogicEvent.openGeneral, this.openGeneralList, this);
    EventMgr.on(LogicEvent.openGeneralDes, this.openGeneralDetail, this);
    EventMgr.on(LogicEvent.openGeneralRoster, this.openRoster, this);
    EventMgr.on(LogicEvent.openGeneralConvert, this.openConvert, this);
    EventMgr.on(LogicEvent.openDraw, this.openDraw, this);
    EventMgr.on(LogicEvent.openDrawResult, this.openDrawResult, this);
    EventMgr.on(LogicEvent.openSkill, this.openSkillList, this);
    EventMgr.on(LogicEvent.openSkillInfo, this.openSkillInfo, this);
    EventMgr.on(LogicEvent.closeSkill, this.closeSkillPanels, this);
    EventMgr.on(LogicEvent.enterLogin, this.reset, this);
    EventMgr.on(LogicEvent.enterMap, this.preload, this);
  }

  destroy(): void {
    EventMgr.targetOff(this);
    this.closeAll();
    GeneralCommand.destroy();
    SkillCommand.destroy();
  }

  private ensureData = async (): Promise<void> => {
    await Promise.all([
      this.generalCommand.ensureConfig(),
      this.skillCommand.ensureConfig(),
    ]);
  };


  private readonly preload = async (): Promise<void> => {
    try {
      await this.ensureData();
      this.generalCommand.queryMyGenerals();
      this.skillCommand.querySkillList();
    } catch (error) {
      this.showError(error, "Không thể tải dữ liệu võ tướng");
    }
  };

  private readonly openGeneralList = async (): Promise<void> => {
    if (this.panels.has("list") || this.opening) return;
    this.opening = true;
    try {
      await this.ensureData();
      const panel = createGeneralListPanel(
        this.generalCommand,
        () => this.closePanel("list"),
      );
      this.openPanel("list", panel);
      this.generalCommand.queryMyGenerals();
      this.skillCommand.querySkillList();
    } catch (error) {
      this.showError(error, "Không thể mở danh sách võ tướng");
    } finally {
      this.opening = false;
    }
  };

  private readonly openGeneralDetail = async (
    _config: GeneralConfig,
    general: GeneralData,
  ): Promise<void> => {
    try {
      await this.ensureData();
      this.closePanel("detail");
      const current = this.generalCommand.proxy.getMyGeneral(general.id) ?? general;
      const panel = createGeneralDetailPanel({
        general: current,
        generalCommand: this.generalCommand,
        skillCommand: this.skillCommand,
        onClose: () => this.closePanel("detail"),
      });
      this.openPanel("detail", panel);
      this.skillCommand.querySkillList();
    } catch (error) {
      this.showError(error, "Không thể mở thông tin võ tướng");
    }
  };

  private readonly openRoster = (): void => {
    this.closePanel("roster");
    this.openPanel(
      "roster",
      createGeneralRosterPanel(this.generalCommand, () => this.closePanel("roster")),
    );
  };

  private readonly openConvert = (): void => {
    this.closePanel("convert");
    this.openPanel(
      "convert",
      createGeneralConvertPanel(this.generalCommand, () => this.closePanel("convert")),
    );
  };

  private readonly openDraw = async (): Promise<void> => {
    try {
      await this.ensureData();
      this.closePanel("draw");
      this.openPanel(
        "draw",
        createGeneralDrawPanel(this.generalCommand, () => this.closePanel("draw")),
      );
    } catch (error) {
      this.showError(error, "Không thể mở chiêu mộ");
    }
  };

  private readonly openDrawResult = (generals: readonly GeneralData[]): void => {
    this.closePanel("draw-result");
    this.openPanel(
      "draw-result",
      createDrawResultPanel(generals, () => this.closePanel("draw-result")),
    );
  };

  private readonly openSkillList = async (
    type = 0,
    general: GeneralData | null = null,
    position = -1,
  ): Promise<void> => {
    try {
      await this.skillCommand.ensureConfig();
      this.closePanel("skill-list");
      this.openPanel(
        "skill-list",
        createSkillListPanel(
          this.skillCommand,
          { type, general, position: Number(position) },
          () => this.closePanel("skill-list"),
        ),
      );
      this.skillCommand.querySkillList();
    } catch (error) {
      this.showError(error, "Không thể mở danh sách kỹ năng");
    }
  };

  private readonly openSkillInfo = (
    skill: SkillData,
    type: number,
    general: GeneralData | null,
    position: number,
  ): void => {
    this.closePanel("skill-info");
    try {
      this.openPanel(
        "skill-info",
        createSkillInfoPanel(
          skill,
          { type, general, position: Number(position) },
          this.skillCommand,
          this.generalCommand,
          () => this.closePanel("skill-info"),
        ),
      );
    } catch (error) {
      this.showError(error, "Không thể mở chi tiết kỹ năng");
    }
  };

  private readonly closeSkillPanels = (): void => {
    this.closePanel("skill-info");
    this.closePanel("skill-list");
  };

  private readonly reset = (): void => {
    this.generalCommand.clearData();
    this.skillCommand.clearData();
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

  private closeAll(): void {
    this.panels.clear();
    this.ui.closeAll();
  }

  private showError(error: unknown, fallback: string): void {
    EventMgr.emit(
      LogicEvent.showToast,
      error instanceof Error ? error.message : fallback,
    );
  }
}
