import { Bootstrap } from "./app/bootstrap";
import { createAppShell } from "./ui/create-app-shell";
import "./ui/styles/theme.css";
import "./ui/styles/app.css";
import "./ui/styles/auth.css";

const shell = createAppShell(document.querySelector<HTMLElement>("#app"));
const bootstrap = new Bootstrap(shell);

bootstrap.start();
