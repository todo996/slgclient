import { ArmyCommand } from "../../legacy/army/army-command";
import type { ArmyData } from "../../legacy/army/army-proxy";
import { LogicEvent } from "../../legacy/common/logic-event";
import { EventMgr } from "../../legacy/events/event-manager";
import { GeneralCommand } from "../../legacy/general/general-command";
import type { GeneralData } from "../../legacy/general/general-proxy";
import type { MapBootstrapSnapshot } from "../../legacy/map/map-bootstrap-command";
import { UIManager } from "../ui-manager";
import { createArmyPanel, createConscriptPanel, createGeneralChooser } from "./army-panels";

export class ArmyFeature {
  private readonly ui: UIManager;
  private readonly command = ArmyCommand.getInstance();
  private readonly panels = new Map<string, HTMLElement>();

  constructor(root: HTMLElement) {
    this.ui = new UIManager(root);
    EventMgr.on(LogicEvent.enterMap, this.onEnterMap, this);
    EventMgr.on(LogicEvent.openArmySetting, this.openArmySetting, this);
    EventMgr.on(LogicEvent.openArmyConscript, this.openConscript, this);
    EventMgr.on(LogicEvent.openGeneralChoose, this.openGeneralChooser, this);
    EventMgr.on(LogicEvent.enterLogin, this.reset, this);
  }

  destroy(): void {
    EventMgr.targetOff(this);
    this.closeAll();
    ArmyCommand.destroy();
  }

  private readonly onEnterMap = async (snapshot?: MapBootstrapSnapshot): Promise<void> => {
    if (snapshot) this.command.updateMyProperty(snapshot.roleProperty);
    try {
      await GeneralCommand.getInstance().ensureConfig();
      GeneralCommand.getInstance().queryMyGenerals();
    } catch (error) {
      EventMgr.emit(LogicEvent.showToast, error instanceof Error ? error.message : "Không tải được dữ liệu đội quân");
    }
  };

  private readonly openArmySetting = (value: unknown, orderValue?: number): void => {
    let cityId = 0;
    let order = Number(orderValue ?? 1);
    if (value && typeof value === "object") {
      const raw = value as Record<string, unknown>;
      cityId = Number(raw.cityId ?? 0);
      order = Number(raw.order ?? order);
    } else cityId = Number(value ?? 0);
    if (!cityId) return;
    this.closePanel("army");
    this.openPanel("army", createArmyPanel(
      this.command,
      cityId,
      order,
      () => this.closePanel("army"),
    ));
    this.command.queryArmyList(cityId);
  };

  private readonly openConscript = (army: ArmyData): void => {
    this.closePanel("conscript");
    this.openPanel("conscript", createConscriptPanel(
      this.command,
      army,
      () => this.closePanel("conscript"),
    ));
  };

  private readonly openGeneralChooser = (
    army: ArmyData,
    position: number,
  ): void => {
    this.closePanel("chooser");
    this.openPanel("chooser", createGeneralChooser(
      GeneralCommand.getInstance(),
      army,
      position,
      (general: GeneralData | null) => {
        this.command.disposeGeneral(army.cityId, general?.id ?? 0, army.order, position);
        this.closePanel("chooser");
      },
      () => this.closePanel("chooser"),
    ));
  };

  private readonly reset = (): void => {
    this.command.clearData();
    this.closeAll();
  };

  private openPanel(key: string, panel: HTMLElement): void { this.panels.set(key, panel); this.ui.open(panel); }
  private closePanel(key: string): void {
    const panel = this.panels.get(key);
    if (!panel) return;
    this.panels.delete(key);
    this.ui.close(panel);
  }
  private closeAll(): void { this.panels.clear(); this.ui.closeAll(); }
}
