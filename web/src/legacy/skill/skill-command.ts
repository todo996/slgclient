import { LogicEvent } from "../common/logic-event";
import { ServerConfig } from "../config/server-config";
import { EventMgr } from "../events/event-manager";
import { NetManager } from "../network/socket/net-manager";
import { SkillProxy } from "./skill-proxy";

type ServerResponse = Readonly<{ code?: number; msg?: unknown }>;
type RawRecord = Record<string, unknown>;
const record = (value: unknown): RawRecord =>
  value !== null && typeof value === "object" ? value as RawRecord : {};

export class SkillCommand {
  private static instance: SkillCommand | null = null;
  private configPromise: Promise<void> | null = null;
  readonly proxy = new SkillProxy();

  static getInstance(): SkillCommand {
    if (!SkillCommand.instance) SkillCommand.instance = new SkillCommand();
    return SkillCommand.instance;
  }

  static destroy(): void {
    SkillCommand.instance?.onDestroy();
    SkillCommand.instance = null;
  }

  private constructor() {
    EventMgr.on(ServerConfig.skill_list, this.onSkillList, this);
    EventMgr.on(ServerConfig.skill_push, this.onSkillPush, this);
  }

  ensureConfig(): Promise<void> {
    if (!this.configPromise) {
      const paths = [
        "/game-assets/config/skill/skill-outline.json",
        "/game-assets/config/skill/active.json",
        "/game-assets/config/skill/passive.json",
        "/game-assets/config/skill/pursuit.json",
        "/game-assets/config/skill/command.json",
      ];
      this.configPromise = Promise.all(paths.map((path) => this.fetchJson(path)))
        .then(([outline, ...configs]) => this.proxy.initSkillConfig(outline, configs))
        .catch((error: unknown) => {
          this.configPromise = null;
          throw error;
        });
    }
    return this.configPromise;
  }

  querySkillList(): void {
    void NetManager.getInstance().send({ name: ServerConfig.skill_list, msg: {} });
  }

  clearData(): void {
    this.proxy.clearData();
  }

  private readonly onSkillList = (data: ServerResponse): void => {
    if (data.code !== 0) return;
    const message = record(data.msg);
    this.proxy.updateSkills(message.list ?? []);
    EventMgr.emit(LogicEvent.skillListInfo);
  };

  private readonly onSkillPush = (data: ServerResponse): void => {
    if (data.code !== 0) return;
    const message = record(data.msg);
    this.proxy.updateSkills([message.skill ?? message]);
    EventMgr.emit(LogicEvent.skillListInfo);
    EventMgr.emit(LogicEvent.updateGeneral);
  };

  private async fetchJson(path: string): Promise<unknown> {
    const response = await fetch(path, { cache: "force-cache" });
    if (!response.ok) throw new Error(`Không tải được cấu hình kỹ năng: ${path}`);
    return response.json() as Promise<unknown>;
  }

  private onDestroy(): void {
    EventMgr.targetOff(this);
    this.proxy.clearData();
    this.configPromise = null;
  }
}
