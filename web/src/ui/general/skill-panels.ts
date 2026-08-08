import { LogicEvent } from "../../legacy/common/logic-event";
import { EventMgr } from "../../legacy/events/event-manager";
import { GeneralCommand } from "../../legacy/general/general-command";
import type { GeneralData } from "../../legacy/general/general-proxy";
import { SkillCommand } from "../../legacy/skill/skill-command";
import {
  getSkillArmLabel,
  renderSkillDescription,
  type SkillConfig,
  type SkillData,
} from "../../legacy/skill/skill-proxy";

type SkillContext = Readonly<{
  type: number;
  general: GeneralData | null;
  position: number;
}>;

const createButton = (label: string, className: string): HTMLButtonElement => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  return button;
};

const getSkillIcon = (config: SkillConfig): string =>
  `/game-assets/ui/general/skill-${config.trigger}.png`;

export function createSkillListPanel(
  command: SkillCommand,
  context: SkillContext,
  onClose: () => void,
): HTMLElement {
  const root = document.createElement("section");
  root.className = "general-system-panel skill-list-panel";
  const stage = document.createElement("div");
  stage.className = "general-system-panel__stage";
  const title = document.createElement("h2");
  title.className = "general-system-panel__title";
  title.textContent = context.type === 1 ? "Học kỹ năng" : "Danh sách kỹ năng";
  const close = createButton("", "general-system-panel__close");
  close.addEventListener("click", onClose);
  close.setAttribute("aria-label", "Đóng danh sách kỹ năng");
  const content = document.createElement("div");
  content.className = "skill-list-panel__content";

  const render = (): void => {
    content.replaceChildren();
    for (const config of command.proxy.getSkillConfigs()) {
      const inventory = command.proxy.getSkill(config.cfgId) ?? {
        id: 0,
        cfgId: config.cfgId,
        generals: [],
      };
      const item = createButton("", "skill-list-panel__item");
      const icon = document.createElement("img");
      icon.src = getSkillIcon(config);
      icon.alt = "";
      const info = document.createElement("span");
      const name = document.createElement("strong");
      name.textContent = config.name;
      const meta = document.createElement("small");
      meta.textContent = `${command.proxy.getTriggerLabel(config.trigger)} · ${getSkillArmLabel(config.arms)} · Đã dùng ${inventory.generals.length}/${config.limit}`;
      const description = document.createElement("em");
      description.textContent = renderSkillDescription(config, 0);
      info.append(name, meta, description);
      item.append(icon, info);
      item.addEventListener("click", () => {
        EventMgr.emit(
          LogicEvent.openSkillInfo,
          inventory,
          context.type,
          context.general,
          context.position,
        );
      });
      content.appendChild(item);
    }
  };

  const resize = (): void => {
    root.style.setProperty(
      "--legacy-panel-scale",
      String(Math.min(window.innerWidth / 1280, window.innerHeight / 720)),
    );
  };
  const observer = new ResizeObserver(resize);
  observer.observe(document.documentElement);
  EventMgr.on(LogicEvent.skillListInfo, render, root);
  root.addEventListener("ui-destroy", () => {
    observer.disconnect();
    EventMgr.targetOff(root);
  }, { once: true });
  stage.append(title, close, content);
  root.appendChild(stage);
  resize();
  render();
  return root;
}

export function createSkillInfoPanel(
  skill: SkillData,
  context: SkillContext,
  skillCommand: SkillCommand,
  generalCommand: GeneralCommand,
  onClose: () => void,
): HTMLElement {
  const config = skillCommand.proxy.getSkillCfg(skill.cfgId);
  if (!config) throw new Error(`Không tìm thấy cấu hình kỹ năng ${skill.cfgId}`);
  const root = document.createElement("section");
  root.className = "general-system-panel skill-info-panel";
  const stage = document.createElement("div");
  stage.className = "skill-info-panel__stage";
  const close = createButton("", "general-system-panel__close");
  close.addEventListener("click", onClose);
  close.setAttribute("aria-label", "Đóng chi tiết kỹ năng");
  const icon = document.createElement("img");
  icon.className = "skill-info-panel__icon";
  icon.src = getSkillIcon(config);
  icon.alt = "";
  const title = document.createElement("h2");
  title.textContent = config.name;

  const learned = context.general?.skills[context.position] ?? null;
  const level = learned?.lv ?? 1;
  const meta = document.createElement("div");
  meta.className = "skill-info-panel__meta";
  const values: ReadonlyArray<readonly [string, string]> = [
    ["Cấp", learned ? String(level) : "Chưa học"],
    ["Loại", skillCommand.proxy.getTriggerLabel(config.trigger)],
    ["Mục tiêu", skillCommand.proxy.getTargetLabel(config.target)],
    ["Binh chủng", getSkillArmLabel(config.arms)],
    ["Xác suất", `${config.levels[0]?.probability ?? 0}%`],
  ];
  for (const [label, value] of values) {
    const row = document.createElement("div");
    const key = document.createElement("span");
    key.textContent = label;
    const val = document.createElement("strong");
    val.textContent = value;
    row.append(key, val);
    meta.appendChild(row);
  }

  const current = document.createElement("section");
  current.className = "skill-info-panel__description";
  const currentTitle = document.createElement("h3");
  currentTitle.textContent = "Hiệu quả hiện tại";
  const currentText = document.createElement("p");
  currentText.textContent = renderSkillDescription(config, Math.max(0, level - 1));
  current.append(currentTitle, currentText);

  const next = document.createElement("section");
  next.className = "skill-info-panel__description";
  const nextTitle = document.createElement("h3");
  nextTitle.textContent = "Cấp tiếp theo";
  const nextText = document.createElement("p");
  nextText.textContent = level < config.levels.length
    ? renderSkillDescription(config, level)
    : "Đã đạt cấp tối đa.";
  next.append(nextTitle, nextText);

  const actions = document.createElement("div");
  actions.className = "skill-info-panel__actions";
  if (context.type === 1 && context.general) {
    const learn = createButton("Học", "general-system-button general-system-button--red");
    learn.disabled = skill.id <= 0 || skill.generals.length >= config.limit;
    learn.addEventListener("click", () => {
      generalCommand.upSkill(context.general!.id, config.cfgId, context.position);
      onClose();
      EventMgr.emit(LogicEvent.closeSkill);
    });
    actions.appendChild(learn);
  }
  if (context.type === 2 && context.general && learned) {
    const upgrade = createButton("Nâng cấp", "general-system-button general-system-button--yellow");
    upgrade.disabled = level >= config.levels.length;
    upgrade.addEventListener("click", () => {
      generalCommand.levelSkill(context.general!.id, context.position);
      onClose();
      EventMgr.emit(LogicEvent.closeSkill);
    });
    const forget = createButton("Quên", "general-system-button general-system-button--red");
    forget.addEventListener("click", () => {
      generalCommand.downSkill(context.general!.id, config.cfgId, context.position);
      onClose();
      EventMgr.emit(LogicEvent.closeSkill);
    });
    actions.append(upgrade, forget);
  }

  const resize = (): void => {
    root.style.setProperty(
      "--legacy-panel-scale",
      String(Math.min(window.innerWidth / 1280, window.innerHeight / 720)),
    );
  };
  const observer = new ResizeObserver(resize);
  observer.observe(document.documentElement);
  root.addEventListener("ui-destroy", () => observer.disconnect(), { once: true });
  stage.append(close, icon, title, meta, current, next, actions);
  root.appendChild(stage);
  resize();
  return root;
}
