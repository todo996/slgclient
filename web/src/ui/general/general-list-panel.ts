import { LogicEvent } from "../../legacy/common/logic-event";
import { EventMgr } from "../../legacy/events/event-manager";
import { GeneralCommand } from "../../legacy/general/general-command";
import { createGeneralCard } from "./general-card";

const createButton = (label: string, className: string): HTMLButtonElement => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  return button;
};


export function createGeneralListPanel(
  command: GeneralCommand,
  onClose: () => void,
): HTMLElement {
  const root = document.createElement("section");
  root.className = "general-list-panel";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "general-list-title");

  const stage = document.createElement("div");
  stage.className = "general-list-panel__stage";

  const title = document.createElement("h2");
  title.id = "general-list-title";
  title.className = "general-list-panel__title";
  title.textContent = "Danh sách võ tướng";

  const close = createButton("", "general-list-panel__close");
  close.setAttribute("aria-label", "Đóng danh sách võ tướng");
  close.addEventListener("click", onClose);

  const counter = document.createElement("div");
  counter.className = "general-list-panel__counter";

  const convert = createButton("Chuyển đổi", "general-list-panel__side-button");
  convert.style.top = "140px";
  convert.addEventListener("click", () => EventMgr.emit(LogicEvent.openGeneralConvert));

  const roster = createButton("Đồ giám", "general-list-panel__side-button");
  roster.style.top = "230px";
  roster.addEventListener("click", () => EventMgr.emit(LogicEvent.openGeneralRoster));

  const scroll = document.createElement("div");
  scroll.className = "general-list-panel__scroll";

  const content = document.createElement("div");
  content.className = "general-list-panel__content";
  scroll.appendChild(content);

  const empty = document.createElement("p");
  empty.className = "general-list-panel__empty";
  empty.textContent = "Đang tải danh sách võ tướng…";

  const render = (): void => {
    const generals = command.proxy.getUseGenerals();
    counter.textContent = `${command.proxy.getMyActiveGeneralCount()}/${command.proxy.getCommonCfg().limit}`;
    content.replaceChildren();
    if (!generals.length) {
      content.appendChild(empty);
      return;
    }
    for (const general of generals) content.appendChild(createGeneralCard(general, {
      onClick: (data) => EventMgr.emit(LogicEvent.openGeneralDes, data.config, data),
    }));
  };

  const resize = (): void => {
    const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    root.style.setProperty("--general-list-scale", String(scale));
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(document.documentElement);
  resize();

  EventMgr.on(LogicEvent.updateGeneralList, render, root);
  root.addEventListener("ui-destroy", () => {
    resizeObserver.disconnect();
    EventMgr.targetOff(root);
  }, { once: true });

  stage.append(title, close, counter, convert, roster, scroll);
  root.appendChild(stage);
  render();
  return root;
}
