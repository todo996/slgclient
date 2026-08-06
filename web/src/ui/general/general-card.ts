import {
  getGeneralArmLabel,
  getGeneralCampLabel,
  type GeneralData,
} from "../../legacy/general/general-proxy";

export type GeneralCardOptions = Readonly<{
  compact?: boolean;
  selected?: boolean;
  showUsed?: boolean;
  onClick?: (data: GeneralData) => void;
}>;

const createStar = (upgraded: boolean): HTMLImageElement => {
  const star = document.createElement("img");
  star.className = upgraded ? "general-card__star is-upgraded" : "general-card__star";
  star.src = "/game-assets/ui/general/star.png";
  star.alt = "";
  return star;
};

export const getGeneralCardImage = (cfgId: number): string =>
  `/game-assets/general/cards/card_${cfgId}.png`;

export function createGeneralCard(
  data: GeneralData,
  options: GeneralCardOptions = {},
): HTMLButtonElement {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "general-card";
  if (options.compact) card.classList.add("general-card--compact");
  if (options.selected) card.classList.add("is-selected");
  card.dataset.generalId = String(data.id);
  card.setAttribute("aria-label", `${data.config.name}, cấp ${data.level}`);
  card.setAttribute("aria-pressed", String(Boolean(options.selected)));

  const background = document.createElement("img");
  background.className = "general-card__background";
  background.src = "/game-assets/ui/general/card-bg.png";
  background.alt = "";

  const portrait = document.createElement("img");
  portrait.className = "general-card__portrait";
  portrait.src = getGeneralCardImage(data.cfgId);
  portrait.alt = data.config.name;
  portrait.loading = "lazy";
  portrait.addEventListener("error", () => {
    portrait.src = "/game-assets/ui/general/card-bg.png";
  }, { once: true });

  const wrap = document.createElement("img");
  wrap.className = "general-card__wrap";
  wrap.src = "/game-assets/ui/general/head-wrap.png";
  wrap.alt = "";

  const name = document.createElement("strong");
  name.className = "general-card__name";
  name.textContent = data.config.name;

  const level = document.createElement("span");
  level.className = "general-card__level";
  level.textContent = `Lv.${data.level}`;

  const camp = document.createElement("span");
  camp.className = "general-card__camp";
  camp.textContent = getGeneralCampLabel(data.config.camp);

  const cost = document.createElement("span");
  cost.className = "general-card__cost";
  cost.textContent = String(data.config.cost);

  const stars = document.createElement("span");
  stars.className = "general-card__stars";
  for (let index = 0; index < Math.min(5, data.config.star); index += 1) {
    stars.appendChild(createStar(index < data.starLv));
  }

  const arm = document.createElement("span");
  arm.className = "general-card__arm";
  arm.textContent = getGeneralArmLabel(data.config.arms);

  card.append(background, portrait, wrap, name, level, camp, cost, stars, arm);

  if (data.order > 0 && options.showUsed !== false) {
    const used = document.createElement("img");
    used.className = "general-card__used";
    used.src = "/game-assets/ui/general/used.png";
    used.alt = "Đang dùng";
    card.appendChild(used);
  }

  if (options.onClick) {
    card.addEventListener("click", () => options.onClick?.(data));
  }
  return card;
}
