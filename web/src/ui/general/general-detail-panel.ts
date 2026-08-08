import { LogicEvent } from "../../legacy/common/logic-event";
import { EventMgr } from "../../legacy/events/event-manager";
import { GeneralCommand } from "../../legacy/general/general-command";
import {
  GENERAL_ATTRIBUTE_KEYS,
  GENERAL_ATTRIBUTE_LABELS,
  getGeneralAttributeText,
  type GeneralData,
} from "../../legacy/general/general-proxy";
import { SkillCommand } from "../../legacy/skill/skill-command";
import { renderSkillDescription } from "../../legacy/skill/skill-proxy";
import { createGeneralCard } from "./general-card";
import {
  adjustAttributeAllocation,
  createAttributeAllocation,
  getAvailableAttributePoints,
  type AttributeAllocation,
} from "./general-system-data";

type TabKey = "description" | "compose" | "attribute";

type Options = Readonly<{
  general: GeneralData;
  generalCommand: GeneralCommand;
  skillCommand: SkillCommand;
  onClose: () => void;
}>;

const createButton = (label: string, className: string): HTMLButtonElement => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  return button;
};

const createSkillButton = (
  general: GeneralData,
  position: number,
  skillCommand: SkillCommand,
): HTMLButtonElement => {
  const learned = general.skills[position] ?? null;
  const config = learned ? skillCommand.proxy.getSkillCfg(learned.cfgId) : null;
  const button = createButton("", "general-detail__skill");
  button.dataset.position = String(position);

  const icon = document.createElement("img");
  icon.src = config
    ? `/game-assets/ui/general/skill-${config.trigger}.png`
    : "/game-assets/ui/general/skill-wrap.png";
  icon.alt = "";

  const name = document.createElement("span");
  name.textContent = config?.name ?? "Chưa học";

  const level = document.createElement("small");
  level.textContent = learned ? `Lv.${learned.lv}` : `Ô ${position + 1}`;

  button.append(icon, name, level);
  button.addEventListener("click", () => {
    if (learned) {
      const inventory = skillCommand.proxy.getSkill(learned.cfgId) ?? {
        id: learned.id,
        cfgId: learned.cfgId,
        generals: [],
      };
      EventMgr.emit(LogicEvent.openSkillInfo, inventory, 2, general, position);
    } else {
      EventMgr.emit(LogicEvent.openSkill, 1, general, position);
    }
  });
  return button;
};

export function createGeneralDetailPanel(options: Options): HTMLElement {
  const { generalCommand, skillCommand, onClose } = options;
  let current = generalCommand.proxy.getMyGeneral(options.general.id) ?? options.general;
  let activeTab: TabKey = "description";
  let allocation: AttributeAllocation = createAttributeAllocation(current);
  let composeSelection = new Set<number>();

  const root = document.createElement("section");
  root.className = "general-system-panel general-detail";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");

  const stage = document.createElement("div");
  stage.className = "general-system-panel__stage";
  const title = document.createElement("h2");
  title.className = "general-system-panel__title";
  const close = createButton("", "general-system-panel__close");
  close.setAttribute("aria-label", "Đóng thông tin võ tướng");
  close.addEventListener("click", onClose);

  const tabs = document.createElement("nav");
  tabs.className = "general-detail__tabs";
  const tabLabels: ReadonlyArray<readonly [TabKey, string]> = [
    ["description", "Thông tin"],
    ["compose", "Tiến cấp"],
    ["attribute", "Cộng điểm"],
  ];
  const body = document.createElement("div");
  body.className = "general-detail__body";

  const updateCurrent = (value?: GeneralData | null): void => {
    if (value?.id === current.id) current = value;
    else current = generalCommand.proxy.getMyGeneral(current.id) ?? current;
    allocation = createAttributeAllocation(current);
    composeSelection.clear();
    render();
  };

  const renderDescription = (): void => {
    const left = document.createElement("div");
    left.className = "general-detail__card-column";
    left.appendChild(createGeneralCard(current, { compact: true }));

    const info = document.createElement("div");
    info.className = "general-detail__info";
    const levelConfig = generalCommand.proxy.getGeneralLevelCfg(current.level + 1);
    const rows: ReadonlyArray<readonly [string, string]> = [
      ["Cấp độ", `${current.level}/${generalCommand.proxy.getMaxLevel()}`],
      ["Kinh nghiệm", `${current.exp}/${levelConfig?.exp ?? "MAX"}`],
      ["Thể lực", `${current.physicalPower}/${current.config.physicalPowerLimit}`],
      ["Cost", String(current.config.cost)],
    ];
    for (const [label, value] of rows) {
      const row = document.createElement("div");
      row.className = "general-detail__summary-row";
      const labelNode = document.createElement("span");
      labelNode.textContent = label;
      const valueNode = document.createElement("strong");
      valueNode.textContent = value;
      row.append(labelNode, valueNode);
      info.appendChild(row);
    }

    const attributes = document.createElement("div");
    attributes.className = "general-detail__attributes";
    for (const key of GENERAL_ATTRIBUTE_KEYS) {
      const row = document.createElement("div");
      row.className = "general-detail__attribute-row";
      const label = document.createElement("span");
      label.textContent = GENERAL_ATTRIBUTE_LABELS[key];
      const value = document.createElement("strong");
      value.textContent = getGeneralAttributeText(current, key);
      row.append(label, value);
      attributes.appendChild(row);
    }

    const skillArea = document.createElement("div");
    skillArea.className = "general-detail__skills";
    for (let index = 0; index < 3; index += 1) {
      skillArea.appendChild(createSkillButton(current, index, skillCommand));
    }

    const description = document.createElement("div");
    description.className = "general-detail__skill-description";
    const firstSkill = current.skills[0];
    const firstConfig = firstSkill ? skillCommand.proxy.getSkillCfg(firstSkill.cfgId) : null;
    description.textContent = firstConfig
      ? renderSkillDescription(firstConfig, Math.max(0, firstSkill!.lv - 1))
      : "Chọn một ô kỹ năng để học hoặc xem chi tiết.";

    info.append(attributes, skillArea, description);
    body.append(left, info);
  };

  const renderCompose = (): void => {
    const currentCard = document.createElement("div");
    currentCard.className = "general-detail__compose-current";
    currentCard.appendChild(createGeneralCard(current, { compact: true }));

    const candidates = generalCommand.proxy.getComposeGenerals(current.cfgId, current.id);
    const list = document.createElement("div");
    list.className = "general-detail__candidate-list";
    if (!candidates.length) {
      const empty = document.createElement("p");
      empty.className = "general-system-panel__empty";
      empty.textContent = "Không có võ tướng trùng để tiến cấp.";
      list.appendChild(empty);
    }
    for (const candidate of candidates) {
      list.appendChild(createGeneralCard(candidate, {
        compact: true,
        selected: composeSelection.has(candidate.id),
        showUsed: false,
        onClick: () => {
          if (composeSelection.has(candidate.id)) composeSelection.delete(candidate.id);
          else composeSelection.add(candidate.id);
          render();
        },
      }));
    }

    const footer = document.createElement("div");
    footer.className = "general-detail__compose-footer";
    const count = document.createElement("strong");
    count.textContent = `Đã chọn: ${composeSelection.size}`;
    const submit = createButton("Tiến cấp", "general-system-button general-system-button--red");
    submit.disabled = composeSelection.size === 0 || current.starLv >= current.config.star;
    submit.addEventListener("click", () => {
      generalCommand.composeGeneral(current.id, [...composeSelection]);
    });
    footer.append(count, submit);
    body.append(currentCard, list, footer);
  };

  const renderAttribute = (): void => {
    const card = document.createElement("div");
    card.className = "general-detail__attribute-card";
    card.appendChild(createGeneralCard(current, { compact: true }));

    const controls = document.createElement("div");
    controls.className = "general-detail__attribute-controls";
    const available = document.createElement("div");
    available.className = "general-detail__available";
    available.textContent = `Điểm còn lại: ${getAvailableAttributePoints(current, allocation) / 100}`;
    controls.appendChild(available);

    for (const key of GENERAL_ATTRIBUTE_KEYS) {
      const row = document.createElement("div");
      row.className = "general-detail__allocation-row";
      const name = document.createElement("strong");
      name.textContent = GENERAL_ATTRIBUTE_LABELS[key];
      const minus = createButton("", "general-detail__minus");
      minus.setAttribute("aria-label", `Giảm ${GENERAL_ATTRIBUTE_LABELS[key]}`);
      const value = document.createElement("span");
      value.textContent = `${allocation[key] / 100}`;
      const plus = createButton("", "general-detail__plus");
      plus.setAttribute("aria-label", `Tăng ${GENERAL_ATTRIBUTE_LABELS[key]}`);
      minus.addEventListener("click", () => {
        allocation = adjustAttributeAllocation(current, allocation, key, -1);
        render();
      });
      plus.addEventListener("click", () => {
        allocation = adjustAttributeAllocation(current, allocation, key, 1);
        render();
      });
      row.append(name, minus, value, plus);
      controls.appendChild(row);
    }

    const submit = createButton("Xác nhận", "general-system-button general-system-button--red");
    submit.addEventListener("click", () => generalCommand.addPrGeneral(
      current.id,
      allocation.force,
      allocation.strategy,
      allocation.defense,
      allocation.speed,
      allocation.destroy,
    ));
    controls.appendChild(submit);
    body.append(card, controls);
  };

  const render = (): void => {
    title.textContent = current.config.name;
    body.replaceChildren();
    for (const button of tabs.querySelectorAll<HTMLButtonElement>("button")) {
      button.classList.toggle("is-active", button.dataset.tab === activeTab);
      button.setAttribute("aria-selected", String(button.dataset.tab === activeTab));
    }
    if (activeTab === "description") renderDescription();
    else if (activeTab === "compose") renderCompose();
    else renderAttribute();
  };

  for (const [key, label] of tabLabels) {
    const button = createButton(label, "general-detail__tab");
    button.dataset.tab = key;
    button.addEventListener("click", () => {
      activeTab = key;
      render();
    });
    tabs.appendChild(button);
  }

  const resize = (): void => {
    const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    root.style.setProperty("--legacy-panel-scale", String(scale));
  };
  const observer = new ResizeObserver(resize);
  observer.observe(document.documentElement);
  EventMgr.on(LogicEvent.updateOneGenerals, updateCurrent, root);
  EventMgr.on(LogicEvent.updateGeneral, updateCurrent, root);
  root.addEventListener("ui-destroy", () => {
    observer.disconnect();
    EventMgr.targetOff(root);
  }, { once: true });

  stage.append(title, close, tabs, body);
  root.appendChild(stage);
  resize();
  render();
  return root;
}
