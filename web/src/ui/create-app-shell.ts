export type AppShell = Readonly<{
  gameCanvasId: string;
  panelRoot: HTMLElement;
  setConnectionStatus: (status: string) => void;
  setPhase: (phase: string) => void;
  showWaiting: (visible: boolean) => void;
  showToast: (message: string) => void;
}>;

function requireRoot(root: HTMLElement | null): HTMLElement {
  if (!root) {
    throw new Error("Không tìm thấy phần tử #app");
  }

  return root;
}

export function createAppShell(rootElement: HTMLElement | null): AppShell {
  const root = requireRoot(rootElement);
  const gameCanvasId = "game-canvas";

  root.innerHTML = `
    <main class="app-shell">
      <section
        id="${gameCanvasId}"
        class="game-canvas"
        aria-label="Khu vực bản đồ game"
      ></section>

      <section id="ui-root" class="ui-root">
        <header class="top-hud">
          <div>
            <p class="top-hud__eyebrow">CLIENT WEB</p>
            <h1 class="top-hud__title">Tam Quốc Truyền Kỳ</h1>
            <p class="top-hud__phase" data-field="phase">Đang khởi tạo</p>
          </div>

          <div class="connection-badge" data-field="connection">
            Đang khởi tạo
          </div>
        </header>

        <div class="panel-layer" data-layer="panels"></div>
        <div class="overlay-layer" data-layer="overlay"></div>
        <div
          class="toast-stack"
          data-layer="toasts"
          aria-live="polite"
          aria-atomic="true"
        ></div>
      </section>
    </main>
  `;

  const connectionElement = root.querySelector<HTMLElement>(
    '[data-field="connection"]',
  );
  const phaseElement = root.querySelector<HTMLElement>(
    '[data-field="phase"]',
  );
  const panelRoot = root.querySelector<HTMLElement>(
    '[data-layer="panels"]',
  );
  const overlayRoot = root.querySelector<HTMLElement>(
    '[data-layer="overlay"]',
  );
  const toastRoot = root.querySelector<HTMLElement>(
    '[data-layer="toasts"]',
  );

  if (
    !connectionElement ||
    !phaseElement ||
    !panelRoot ||
    !overlayRoot ||
    !toastRoot
  ) {
    throw new Error("Không tạo được app shell");
  }

  return {
    gameCanvasId,
    panelRoot,
    setConnectionStatus(status: string): void {
      connectionElement.textContent = status;
    },
    setPhase(phase: string): void {
      phaseElement.textContent = phase;
    },
    showWaiting(visible: boolean): void {
      overlayRoot.replaceChildren();
      if (!visible) return;

      const waiting = document.createElement("div");
      waiting.className = "waiting-overlay";
      waiting.setAttribute("role", "status");
      waiting.setAttribute("aria-label", "Đang xử lý yêu cầu");
      waiting.innerHTML = `
        <div class="waiting-card">
          <span class="waiting-spinner" aria-hidden="true"></span>
          <span>Đang xử lý...</span>
        </div>
      `;
      overlayRoot.appendChild(waiting);
    },
    showToast(message: string): void {
      if (!message.trim()) return;

      const toast = document.createElement("button");
      toast.type = "button";
      toast.className = "game-toast";
      toast.textContent = message;
      toast.addEventListener("click", () => toast.remove(), {
        once: true,
      });
      toastRoot.appendChild(toast);

      window.setTimeout(() => toast.remove(), 3600);
    },
  };
}
