import { Bootstrap } from "./app/bootstrap";
import { createAppShell } from "./ui/create-app-shell";
import { GeneralFeature } from "./ui/general/general-feature";
import { ArmyFeature } from "./ui/army/army-feature";
import { WarReportFeature } from "./ui/war/war-report-feature";
import "./ui/styles/theme.css";
import "./ui/styles/app.css";
import "./ui/styles/auth.css";
import "./ui/styles/map-hud.css";
import "./ui/styles/general-list.css";
import "./ui/styles/general-system.css";
import "./ui/styles/army-system.css";
import "./ui/styles/war-report.css";

const shell = createAppShell(document.querySelector<HTMLElement>("#app"));
const bootstrap = new Bootstrap(shell);
const generalFeature = new GeneralFeature(shell.panelRoot);
const armyFeature = new ArmyFeature(shell.panelRoot);
const warReportFeature = new WarReportFeature(shell.panelRoot);

bootstrap.start();
window.addEventListener("beforeunload", () => {
  generalFeature.destroy();
  armyFeature.destroy();
  warReportFeature.destroy();
}, { once: true });
