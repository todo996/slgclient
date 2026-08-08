import { ArmyCommand } from "../../legacy/army/army-command";
import { ArmyCmd, type ArmyData } from "../../legacy/army/army-proxy";
import { LogicEvent } from "../../legacy/common/logic-event";
import { EventMgr } from "../../legacy/events/event-manager";
import { GeneralCommand } from "../../legacy/general/general-command";
import type { GeneralData } from "../../legacy/general/general-proxy";
import { createGeneralCard } from "../general/general-card";

const button = (label: string, className: string): HTMLButtonElement => {
  const result = document.createElement("button");
  result.type = "button";
  result.className = className;
  result.textContent = label;
  return result;
};
const setupPanel = (root: HTMLElement): { stage: HTMLElement; close: HTMLButtonElement } => {
  const stage = document.createElement("div");
  stage.className = "army-panel__stage";
  const close = button("", "army-panel__close");
  const resize = (): void => root.style.setProperty(
    "--army-panel-scale",
    String(Math.min(window.innerWidth / 1280, window.innerHeight / 720)),
  );
  const observer = new ResizeObserver(resize);
  observer.observe(document.documentElement);
  root.addEventListener("ui-destroy", () => {
    observer.disconnect();
    EventMgr.targetOff(root);
  }, { once: true });
  root.appendChild(stage);
  resize();
  return { stage, close };
};

export function createArmyPanel(
  command: ArmyCommand,
  cityId: number,
  initialOrder: number,
  onClose: () => void,
): HTMLElement {
  const root = document.createElement("section");
  root.className = "army-panel";
  const { stage, close } = setupPanel(root);
  close.setAttribute("aria-label", "Đóng thiết lập đội quân");
  close.addEventListener("click", onClose);
  const title = document.createElement("h2");
  title.textContent = "Thiết lập đội quân";
  const slotList = document.createElement("nav");
  slotList.className = "army-panel__slots";
  const body = document.createElement("div");
  body.className = "army-panel__body";
  let selectedOrder = Math.max(1, Math.min(5, initialOrder));

  const getSelected = (): ArmyData | null => command.proxy.getArmyByOrder(selectedOrder, cityId);
  const renderBody = (): void => {
    body.replaceChildren();
    const army = getSelected();
    if (!army) {
      const empty = document.createElement("p");
      empty.className = "army-panel__empty";
      empty.textContent = "Đội quân chưa được mở.";
      body.appendChild(empty);
      return;
    }
    const generals = command.getArmyGenerals(army);
    const cards = document.createElement("div");
    cards.className = "army-panel__generals";
    for (let position = 0; position < 3; position += 1) {
      const holder = button("", "army-panel__general-slot");
      const general = generals[position] ?? null;
      if (general) holder.appendChild(createGeneralCard(general, { compact: true }));
      else {
        const plus = document.createElement("strong");
        plus.textContent = "+";
        const label = document.createElement("span");
        label.textContent = position === 0 ? "Chủ tướng" : "Phó tướng";
        holder.append(plus, label);
      }
      holder.addEventListener("click", () => EventMgr.emit(LogicEvent.openGeneralChoose, army, position));
      cards.appendChild(holder);
    }

    const stats = document.createElement("div");
    stats.className = "army-panel__stats";
    const values: ReadonlyArray<readonly [string, string]> = [
      ["Trạng thái", command.getArmyStateDescription(army)],
      ["Thể lực", String(command.getArmyPhysicalPower(army))],
      ["Binh lực", `${command.getArmyCurrentSoldiers(army)}/${command.getArmyTotalSoldiers(generals)}`],
      ["Tốc độ", command.getArmySpeed(generals).toFixed(2)],
      ["Công thành", command.getArmyDestroy(generals).toFixed(2)],
      ["Phe đồng nhất", String(command.getArmyCamp(generals))],
    ];
    for (const [name, value] of values) {
      const row = document.createElement("div");
      const key = document.createElement("span"); key.textContent = name;
      const val = document.createElement("strong"); val.textContent = value;
      row.append(key, val); stats.appendChild(row);
    }

    const actions = document.createElement("div");
    actions.className = "army-panel__actions";
    const conscript = button("Chiêu mộ", "army-action army-action--red");
    conscript.disabled = army.state > 0;
    conscript.addEventListener("click", () => EventMgr.emit(LogicEvent.openArmyConscript, army));
    const locate = button("Đến vị trí", "army-action");
    locate.addEventListener("click", () => EventMgr.emit(LogicEvent.scrollToMap, army.x, army.y));
    const commandBox = document.createElement("div");
    commandBox.className = "army-panel__command";
    const x = document.createElement("input"); x.type = "number"; x.min = "0"; x.max = "199"; x.value = String(army.toX);
    const y = document.createElement("input"); y.type = "number"; y.min = "0"; y.max = "199"; y.value = String(army.toY);
    commandBox.append(x, y);
    const commandDefinitions: readonly [number, string][] = [
      [ArmyCmd.Attack, "Tấn công"], [ArmyCmd.Garrison, "Đồn trú"],
      [ArmyCmd.Reclaim, "Đồn điền"], [ArmyCmd.Transfer, "Điều động"],
    ];
    for (const [cmd, label] of commandDefinitions) {
      const action = button(label, "army-action");
      action.disabled = army.state > 0 || !generals[0];
      action.addEventListener("click", () => command.assign(army.id, cmd, Number(x.value), Number(y.value)));
      commandBox.appendChild(action);
    }
    actions.append(conscript, locate, commandBox);
    body.append(cards, stats, actions);
  };

  const renderSlots = (): void => {
    slotList.replaceChildren();
    for (let order = 1; order <= 5; order += 1) {
      const army = command.proxy.getArmyByOrder(order, cityId);
      const item = button(`Đội ${order}`, "army-panel__slot");
      item.classList.toggle("is-active", order === selectedOrder);
      item.appendChild(document.createElement("small")).textContent = army ? command.getArmyStateDescription(army) : "[Chưa mở]";
      item.addEventListener("click", () => { selectedOrder = order; renderSlots(); renderBody(); });
      slotList.appendChild(item);
    }
  };
  const refresh = (): void => { renderSlots(); renderBody(); };
  EventMgr.on(LogicEvent.updateArmyList, refresh, root);
  EventMgr.on(LogicEvent.updateArmy, refresh, root);
  stage.append(title, close, slotList, body);
  refresh();
  return root;
}

export function createGeneralChooser(
  command: GeneralCommand,
  army: ArmyData,
  position: number,
  onChoose: (general: GeneralData | null) => void,
  onClose: () => void,
): HTMLElement {
  const root = document.createElement("section"); root.className = "army-panel army-chooser";
  const { stage, close } = setupPanel(root); close.addEventListener("click", onClose);
  const title = document.createElement("h2"); title.textContent = position === 0 ? "Chọn chủ tướng" : "Chọn phó tướng";
  const content = document.createElement("div"); content.className = "army-chooser__content";
  const remove = button("Bỏ vị trí này", "army-action army-action--red"); remove.addEventListener("click", () => onChoose(null));
  content.appendChild(remove);
  const currentIds = new Set(army.generals.filter((id) => id > 0));
  for (const general of command.proxy.getMyGenerals()) {
    if (general.order > 0 && !currentIds.has(general.id)) continue;
    content.appendChild(createGeneralCard(general, {
      compact: true,
      selected: army.generals[position] === general.id,
      onClick: () => onChoose(general),
    }));
  }
  stage.append(title, close, content); return root;
}

export function createConscriptPanel(
  command: ArmyCommand,
  army: ArmyData,
  onClose: () => void,
): HTMLElement {
  const root = document.createElement("section"); root.className = "army-panel army-conscript";
  const { stage, close } = setupPanel(root); close.addEventListener("click", onClose);
  const title = document.createElement("h2"); title.textContent = "Chiêu mộ binh lính";
  const generals = command.getArmyGenerals(army);
  const values = [0, 0, 0];
  const content = document.createElement("div"); content.className = "army-conscript__content";
  for (let index = 0; index < 3; index += 1) {
    const general = generals[index] ?? null;
    const max = general ? GeneralCommand.getInstance().proxy.getGeneralLevelCfg(general.level)?.soldiers ?? 0 : 0;
    const current = army.soldiers[index] ?? 0;
    const row = document.createElement("label");
    const name = document.createElement("span"); name.textContent = general?.config.name ?? `Vị trí ${index + 1}`;
    const status = document.createElement("small"); status.textContent = `${current}/${max}`;
    const input = document.createElement("input"); input.type = "number"; input.min = "0"; input.max = String(Math.max(0, max - current)); input.value = "0";
    input.disabled = !general;
    input.addEventListener("input", () => { values[index] = Math.max(0, Math.min(Number(input.max), Number(input.value))); });
    row.append(name, status, input); content.appendChild(row);
  }
  const submit = button("Bắt đầu chiêu mộ", "army-action army-action--red");
  submit.addEventListener("click", () => { command.conscript(army.id, values); onClose(); });
  content.appendChild(submit); stage.append(title, close, content); return root;
}
