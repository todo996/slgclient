import { LogicEvent } from "../../legacy/common/logic-event";
import { EventMgr } from "../../legacy/events/event-manager";
import { GeneralCommand } from "../../legacy/general/general-command";
import type { WarGeneralSnapshot, WarReport, WarReportRound, WarReportSkill } from "../../legacy/war/war-report-proxy";
import { getOwnBattleResult } from "../../legacy/war/war-report-proxy";
import { SkillCommand } from "../../legacy/skill/skill-command";
import { WarReportCommand } from "../../legacy/war/war-report-command";
import { getGeneralCardImage } from "../general/general-card";

const WAR_SCALE_PROPERTY = "--war-report-scale";
const PAGE_SIZE = 6;

const button = (label: string, className: string): HTMLButtonElement => {
  const result = document.createElement("button");
  result.type = "button";
  result.className = className;
  result.textContent = label;
  return result;
};

const setup = (root: HTMLElement): { stage: HTMLElement; close: HTMLButtonElement } => {
  const stage = document.createElement("div");
  stage.className = "war-report__stage";
  const close = button("", "war-report__close");
  close.setAttribute("aria-label", "Đóng chiến báo");
  const resize = (): void => root.style.setProperty(
    WAR_SCALE_PROPERTY,
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

const formatTime = (timestamp: number): string => {
  const millis = timestamp > 1e12 ? timestamp : timestamp * 1000;
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) return "";
  const value = (part: number): string => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${value(date.getMonth() + 1)}-${value(date.getDate())} ${value(date.getHours())}:${value(date.getMinutes())}:${value(date.getSeconds())}`;
};

const generalName = (general: WarGeneralSnapshot | null): string => {
  if (!general) return "Võ tướng";
  return GeneralCommand.getInstance().proxy.getGeneralCfg(general.cfgId)?.name
    ?? `Võ tướng ${general.cfgId}`;
};

const createGeneralPortrait = (general: WarGeneralSnapshot): HTMLElement => {
  const item = document.createElement("span");
  item.className = "war-report__general";
  const image = document.createElement("img");
  image.src = getGeneralCardImage(general.cfgId);
  image.alt = generalName(general);
  image.loading = "lazy";
  const level = document.createElement("small");
  level.textContent = `Lv.${general.level}`;
  item.append(image, level);
  return item;
};

const appendTeam = (root: HTMLElement, generals: readonly WarGeneralSnapshot[]): void => {
  for (const general of generals.slice(0, 3)) root.appendChild(createGeneralPortrait(general));
  for (let index = generals.length; index < 3; index += 1) {
    const empty = document.createElement("span");
    empty.className = "war-report__general is-empty";
    root.appendChild(empty);
  }
};

const resultLabel = (report: WarReport, roleId: number): string => ({
  win: "Thắng",
  draw: "Hòa",
  lose: "Bại",
  unknown: "Kết quả",
})[getOwnBattleResult(report, roleId)];

const createListItem = (
  report: WarReport,
  roleId: number,
  isRead: boolean,
  onOpen: (report: WarReport) => void,
  onLocate: (report: WarReport) => void,
): HTMLElement => {
  const item = document.createElement("article");
  item.className = "war-report__item";
  item.classList.toggle("is-read", isRead);
  item.dataset.reportId = String(report.id);

  const attack = document.createElement("div");
  attack.className = "war-report__team is-attack";
  appendTeam(attack, report.beginAttackGenerals);
  const defense = document.createElement("div");
  defense.className = "war-report__team is-defense";
  appendTeam(defense, report.beginDefenseGenerals);

  const result = button(resultLabel(report, roleId), "war-report__result");
  result.classList.add(`is-${getOwnBattleResult(report, roleId)}`);
  result.addEventListener("click", () => onOpen(report));

  const left = document.createElement("strong");
  left.className = "war-report__side-label is-attack";
  left.textContent = roleId === report.attackRid ? "Ta" : "Địch";
  const right = document.createElement("strong");
  right.className = "war-report__side-label is-defense";
  right.textContent = roleId === report.defenseRid ? "Ta" : "Địch";

  const time = document.createElement("time");
  time.className = "war-report__time";
  time.textContent = formatTime(report.createTime);

  const locate = button(`(${report.x},${report.y})`, "war-report__position");
  locate.addEventListener("click", (event) => {
    event.stopPropagation();
    onLocate(report);
  });

  item.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).closest("button")) return;
    onOpen(report);
  });
  item.append(attack, defense, left, right, result, time, locate);
  return item;
};

export function createWarReportPanel(
  command: WarReportCommand,
  roleId: number,
  onOpen: (report: WarReport) => void,
  onClose: () => void,
  onLocate: (report: WarReport) => void,
): HTMLElement {
  const root = document.createElement("section");
  root.className = "war-report";
  const { stage, close } = setup(root);
  close.addEventListener("click", onClose);
  const title = document.createElement("h2");
  title.textContent = "Chiến báo";
  const readAll = button("Đọc tất cả", "war-report__read-all");
  readAll.addEventListener("click", () => command.markRead(0));
  const list = document.createElement("div");
  list.className = "war-report__list";
  const footer = document.createElement("p");
  footer.className = "war-report__footer";

  const render = (): void => {
    const reports = command.proxy.getReports();
    list.replaceChildren();
    for (const report of reports) {
      list.appendChild(createListItem(
        report,
        roleId,
        command.proxy.isRead(report),
        (selected) => {
          if (!command.proxy.isRead(selected)) command.markRead(selected.id);
          onOpen(selected);
        },
        onLocate,
      ));
    }
    if (!reports.length) {
      const empty = document.createElement("p");
      empty.className = "war-report__empty";
      empty.textContent = "Chưa có chiến báo.";
      list.appendChild(empty);
    }
    footer.textContent = `${reports.length} chiến báo · ${command.proxy.unreadCount()} chưa đọc`;
  };
  EventMgr.on(LogicEvent.updateWarReport, render, root);
  stage.append(title, close, readAll, list, footer);
  render();
  return root;
}

const sideFor = (report: WarReport, generalId: number): "attack" | "defense" | "unknown" => {
  if (report.beginAttackGenerals.some((general) => general.id === generalId)) return "attack";
  if (report.beginDefenseGenerals.some((general) => general.id === generalId)) return "defense";
  return "unknown";
};

const positionLabel = (report: WarReport, general: WarGeneralSnapshot): string => {
  const side = sideFor(report, general.id);
  const team = side === "attack" ? report.beginAttackGenerals : report.beginDefenseGenerals;
  const position = team.findIndex((item) => item.id === general.id);
  return position === 0 ? "Chủ tướng" : "Phó tướng";
};

const describeGeneral = (report: WarReport, general: WarGeneralSnapshot | null): string => {
  if (!general) return "Võ tướng";
  const side = sideFor(report, general.id) === "attack" ? "Công" : "Thủ";
  return `${side} ${generalName(general)} (${positionLabel(report, general)})`;
};

const appendColored = (
  root: HTMLElement,
  text: string,
  className: string,
): void => {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  root.appendChild(span);
};

const effectText = (skill: WarReportSkill): string => {
  const names: Record<number, string> = {
    2: "vũ lực",
    3: "phòng thủ",
    4: "mưu lược",
    5: "tốc độ",
    6: "công thành",
  };
  return skill.includeEffect.flatMap((effect, index): string[] => {
    const name = names[effect];
    if (!name) return [];
    const duration = skill.effectRound[index] ?? 0;
    return [`${name} +${skill.effectValue[index] ?? 0}${duration > 0 ? ` trong ${duration} lượt` : ""}`];
  }).join("; ");
};

const appendSkill = (
  root: HTMLElement,
  report: WarReport,
  skill: WarReportSkill,
): void => {
  const source = [...report.beginAttackGenerals, ...report.beginDefenseGenerals]
    .find((general) => general.id === skill.fromId) ?? null;
  if (!source) return;
  const line = document.createElement("p");
  line.className = "war-report__battle-line";
  appendColored(line, describeGeneral(report, source), `is-${sideFor(report, source.id)}`);
  line.append(document.createTextNode(" sử dụng kỹ năng "));
  const skillConfig = SkillCommand.getInstance().proxy.getSkillCfg(skill.cfgId);
  appendColored(line, `${skillConfig?.name ?? `Kỹ năng ${skill.cfgId}`} (cấp ${skill.level})`, "is-skill");

  const targetNames = skill.toId.flatMap((id): string[] => {
    const target = [...report.beginAttackGenerals, ...report.beginDefenseGenerals]
      .find((general) => general.id === id) ?? null;
    return target ? [describeGeneral(report, target)] : [];
  });
  if (targetNames.length) line.append(document.createTextNode(` lên ${targetNames.join(", ")}`));
  const effects = effectText(skill);
  if (effects) {
    line.append(document.createTextNode(": "));
    appendColored(line, effects, "is-skill");
  }
  const losses = skill.kill.flatMap((loss, index): string[] => {
    const targetId = skill.toId[index];
    const target = [...report.beginAttackGenerals, ...report.beginDefenseGenerals]
      .find((general) => general.id === targetId) ?? null;
    return target ? [`${describeGeneral(report, target)} mất ${loss} binh lính`] : [];
  });
  if (losses.length) {
    line.append(document.createTextNode(". Gây "));
    appendColored(line, losses.join("; "), "is-loss");
  }
  root.appendChild(line);
};

const appendTurn = (root: HTMLElement, report: WarReport, turn: WarReportRound): void => {
  const article = document.createElement("article");
  article.className = "war-report__round";
  const title = document.createElement("h3");
  title.textContent = `Hiệp ${turn.round} · Lượt ${turn.turn}`;
  article.appendChild(title);
  for (const skill of turn.attackBefore) appendSkill(article, report, skill);
  if (turn.attack && turn.defense) {
    const line = document.createElement("p");
    line.className = "war-report__battle-line";
    appendColored(line, describeGeneral(report, turn.attack), `is-${sideFor(report, turn.attack.id)}`);
    line.append(document.createTextNode(" tấn công "));
    appendColored(line, describeGeneral(report, turn.defense), `is-${sideFor(report, turn.defense.id)}`);
    line.append(document.createTextNode(", khiến đối phương mất "));
    appendColored(line, String(turn.defenseLoss), "is-loss");
    line.append(document.createTextNode(" binh lính."));
    article.appendChild(line);
  }
  for (const skill of turn.attackAfter) appendSkill(article, report, skill);
  for (const skill of turn.defenseAfter) appendSkill(article, report, skill);
  root.appendChild(article);
};

const finalText = (report: WarReport, roleId: number): string => {
  const result = getOwnBattleResult(report, roleId);
  if (result === "lose") return "Binh lực chủ tướng phe ta đã cạn. Trận chiến thất bại.";
  if (result === "draw") return "Hai bên bất phân thắng bại. Trận chiến kết thúc với kết quả hòa.";
  if (result === "win" && report.occupy === 1) {
    return `Binh lực chủ tướng đối phương đã cạn. Phe ta chiếm lãnh địa (${report.x}, ${report.y}).`;
  }
  if (result === "win") {
    return `Binh lực chủ tướng đối phương đã cạn. Phe ta gây ${Math.ceil(report.destroyDurable / 100)} sát thương độ bền cho lãnh địa (${report.x}, ${report.y}).`;
  }
  return "Trận chiến đã kết thúc.";
};

export function createWarReportDetailPanel(
  report: WarReport,
  roleId: number,
  onClose: () => void,
  onLocate: (report: WarReport) => void,
): HTMLElement {
  const root = document.createElement("section");
  root.className = "war-report war-report--detail";
  const { stage, close } = setup(root);
  close.addEventListener("click", onClose);
  const title = document.createElement("h2");
  title.textContent = "Chi tiết chiến báo";
  const locate = button(`Tọa độ (${report.x},${report.y})`, "war-report__read-all");
  locate.addEventListener("click", () => onLocate(report));
  const content = document.createElement("div");
  content.className = "war-report__detail-content";
  let rendered = 0;
  const appendPage = (): void => {
    const end = Math.min(report.rounds.length, rendered + PAGE_SIZE);
    for (; rendered < end; rendered += 1) appendTurn(content, report, report.rounds[rendered]!);
    if (rendered >= report.rounds.length && !content.querySelector(".war-report__final")) {
      const final = document.createElement("p");
      final.className = "war-report__final";
      final.textContent = finalText(report, roleId);
      content.appendChild(final);
    }
  };
  content.addEventListener("scroll", () => {
    if (content.scrollTop + content.clientHeight >= content.scrollHeight - 80) appendPage();
  });
  stage.append(title, close, locate, content);
  appendPage();
  return root;
}
