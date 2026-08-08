import { GeneralCommand } from "../../legacy/general/general-command";
import type { GeneralConfig, GeneralData } from "../../legacy/general/general-proxy";
import { createGeneralCard } from "./general-card";
import { sortGeneralRoster } from "./general-system-data";

const configToCard = (config: GeneralConfig): GeneralData => ({
  id: 0,
  cfgId: config.cfgId,
  exp: 0,
  level: 1,
  physicalPower: config.physicalPowerLimit,
  order: 0,
  starLv: config.star,
  parentId: 0,
  state: 0,
  hasPrPoint: 0,
  usePrPoint: 0,
  forceAdded: 0,
  strategyAdded: 0,
  defenseAdded: 0,
  speedAdded: 0,
  destroyAdded: 0,
  skills: [],
  config,
});

export function createGeneralRosterPanel(
  command: GeneralCommand,
  onClose: () => void,
): HTMLElement {
  const root = document.createElement("section");
  root.className = "general-system-panel general-roster-panel";
  const stage = document.createElement("div");
  stage.className = "general-system-panel__stage";
  const title = document.createElement("h2");
  title.className = "general-system-panel__title";
  title.textContent = "Đồ giám võ tướng";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "general-system-panel__close";
  close.setAttribute("aria-label", "Đóng đồ giám");
  close.addEventListener("click", onClose);
  const content = document.createElement("div");
  content.className = "general-roster-panel__content";
  for (const config of sortGeneralRoster(command.proxy.getGeneralAllCfg())) {
    const holder = document.createElement("article");
    holder.className = "general-roster-panel__item";
    const count = command.proxy.getGeneralIds(config.cfgId).length;
    holder.classList.toggle("is-locked", count === 0);
    holder.appendChild(createGeneralCard(configToCard(config), { showUsed: false }));
    const owned = document.createElement("strong");
    owned.textContent = count > 0 ? `Đã có ×${count}` : "Chưa sở hữu";
    holder.appendChild(owned);
    content.appendChild(holder);
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
