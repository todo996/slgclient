import { LogicEvent } from "../../legacy/common/logic-event";
import { EventMgr } from "../../legacy/events/event-manager";
import { GeneralCommand } from "../../legacy/general/general-command";
import { createGeneralCard } from "./general-card";
import { MAX_CONVERT_SELECTION, toggleLimitedSelection } from "./general-system-data";

export function createGeneralConvertPanel(
  command: GeneralCommand,
  onClose: () => void,
): HTMLElement {
  let selected: ReadonlySet<number> = new Set();
  const root = document.createElement("section");
  root.className = "general-system-panel general-convert-panel";
  const stage = document.createElement("div");
  stage.className = "general-system-panel__stage";
  const title = document.createElement("h2");
  title.className = "general-system-panel__title";
  title.textContent = "Chuyển đổi võ tướng";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "general-system-panel__close";
  close.setAttribute("aria-label", "Đóng chuyển đổi");
  close.addEventListener("click", onClose);
  const content = document.createElement("div");
  content.className = "general-convert-panel__content";
  const footer = document.createElement("footer");
  footer.className = "general-convert-panel__footer";

  const render = (): void => {
    content.replaceChildren();
    for (const general of command.proxy.getMyGeneralsNotUse()) {
      content.appendChild(createGeneralCard(general, {
        compact: true,
        selected: selected.has(general.id),
        showUsed: false,
        onClick: () => {
          selected = toggleLimitedSelection(selected, general.id, MAX_CONVERT_SELECTION);
          render();
        },
      }));
    }
    footer.replaceChildren();
    const count = document.createElement("strong");
    count.textContent = `Đã chọn ${selected.size}/${MAX_CONVERT_SELECTION}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "general-system-button general-system-button--red";
    button.textContent = "Chuyển đổi";
    button.disabled = selected.size === 0;
    button.addEventListener("click", () => command.convert([...selected]));
    footer.append(count, button);
  };
  const onConverted = (message: unknown): void => {
    const raw = message && typeof message === "object" ? message as Record<string, unknown> : {};
    EventMgr.emit(LogicEvent.showToast, `Nhận vàng: ${Number(raw.add_gold ?? 0)}`);
    selected = new Set();
    render();
  };
  EventMgr.on(LogicEvent.generalConvert, onConverted, root);
  EventMgr.on(LogicEvent.updateGeneralList, render, root);
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
  stage.append(title, close, content, footer);
  root.appendChild(stage);
  resize();
  render();
  return root;
}
