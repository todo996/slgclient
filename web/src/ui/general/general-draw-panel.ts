import { LogicEvent } from "../../legacy/common/logic-event";
import { EventMgr } from "../../legacy/events/event-manager";
import { GeneralCommand } from "../../legacy/general/general-command";
import type { GeneralData } from "../../legacy/general/general-proxy";
import { LoginCommand } from "../../legacy/login/login-command";
import { createGeneralCard } from "./general-card";
import { readRoleGold } from "./general-system-data";

export function createGeneralDrawPanel(
  command: GeneralCommand,
  onClose: () => void,
): HTMLElement {
  const root = document.createElement("section");
  root.className = "general-system-panel general-draw-panel";
  const stage = document.createElement("div");
  stage.className = "general-system-panel__stage";
  const title = document.createElement("h2");
  title.className = "general-system-panel__title";
  title.textContent = "Chiêu mộ võ tướng";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "general-system-panel__close";
  close.setAttribute("aria-label", "Đóng chiêu mộ");
  close.addEventListener("click", onClose);
  const card = document.createElement("img");
  card.className = "general-draw-panel__card";
  card.src = "/game-assets/ui/general/draw-card.png";
  card.alt = "Chiêu mộ võ tướng";
  const gold = document.createElement("strong");
  gold.className = "general-draw-panel__gold";
  const actions = document.createElement("div");
  actions.className = "general-draw-panel__actions";

  const renderGold = (): void => {
    const value = readRoleGold(LoginCommand.getInstance().proxy.getRoleResData());
    gold.textContent = `Vàng: ${value}`;
  };
  const addDrawButton = (times: number): void => {
    const cost = command.proxy.getCommonCfg().drawGeneralCost * times;
    const button = document.createElement("button");
    button.type = "button";
    button.className = times === 10
      ? "general-system-button general-system-button--yellow"
      : "general-system-button general-system-button--red";
    button.textContent = `Chiêu mộ ${times} lần · ${cost} vàng`;
    button.addEventListener("click", () => {
      EventMgr.emit(LogicEvent.showWaiting);
      command.drawGenerals(times);
    });
    actions.appendChild(button);
  };
  addDrawButton(1);
  addDrawButton(10);
  EventMgr.on(LogicEvent.updateMyRoleRes, renderGold, root);
  const resize = (): void => root.style.setProperty(
    "--legacy-panel-scale",
    String(Math.min(window.innerWidth / 1280, window.innerHeight / 720)),
  );
  const observer = new ResizeObserver(resize);
  observer.observe(document.documentElement);
  root.addEventListener("ui-destroy", () => {
    observer.disconnect();
    EventMgr.targetOff(root);
  }, { once: true });
  stage.append(title, close, card, gold, actions);
  root.appendChild(stage);
  resize();
  renderGold();
  return root;
}

export function createDrawResultPanel(
  generals: readonly GeneralData[],
  onClose: () => void,
): HTMLElement {
  const root = document.createElement("section");
  root.className = "general-system-panel draw-result-panel";
  const stage = document.createElement("div");
  stage.className = "general-system-panel__stage";
  const title = document.createElement("h2");
  title.className = "general-system-panel__title";
  title.textContent = "Kết quả chiêu mộ";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "general-system-panel__close";
  close.setAttribute("aria-label", "Đóng kết quả");
  close.addEventListener("click", onClose);
  const content = document.createElement("div");
  content.className = "draw-result-panel__content";
  for (const general of generals) {
    content.appendChild(createGeneralCard(general, { compact: true, showUsed: false }));
  }
  const resize = (): void => root.style.setProperty(
    "--legacy-panel-scale",
    String(Math.min(window.innerWidth / 1280, window.innerHeight / 720)),
  );
  const observer = new ResizeObserver(resize);
  observer.observe(document.documentElement);
  root.addEventListener("ui-destroy", () => observer.disconnect(), { once: true });
  stage.append(title, close, content);
  root.appendChild(stage);
  resize();
  return root;
}
