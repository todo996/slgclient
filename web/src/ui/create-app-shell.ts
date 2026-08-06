export type AppShell = Readonly<{
  gameCanvasId: string;
  setConnectionStatus: (status: string) => void;
  setEnvironment: (httpUrl: string, wsUrl: string) => void;
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
          </div>

          <div class="connection-badge" data-field="connection">
            Đang khởi tạo
          </div>
        </header>

        <aside class="game-panel migration-panel">
          <header class="game-panel__header">
            <h2 class="game-panel__title">Chuyển đổi không đổi gameplay</h2>
          </header>

          <div class="game-panel__body">
            <p class="text-box">
              Phaser đã quản lý vùng bản đồ. Menu và khung chữ dùng HTML/CSS
              để chuyển prefab nhanh, rõ chữ và tối ưu thao tác trên iPhone.
            </p>

            <dl class="environment-list">
              <div>
                <dt>HTTP</dt>
                <dd data-field="http-url">Chưa cấu hình</dd>
              </div>
              <div>
                <dt>WebSocket</dt>
                <dd data-field="ws-url">Chưa cấu hình</dd>
              </div>
            </dl>

            <p class="migration-panel__note">
              Bước kế tiếp: nối NetManager/WebSock cũ và tải map thật từ
              assets/resources.
            </p>
          </div>
        </aside>
      </section>
    </main>
  `;

  const connectionElement = root.querySelector<HTMLElement>(
    '[data-field="connection"]',
  );
  const httpElement = root.querySelector<HTMLElement>(
    '[data-field="http-url"]',
  );
  const wsElement = root.querySelector<HTMLElement>(
    '[data-field="ws-url"]',
  );

  if (!connectionElement || !httpElement || !wsElement) {
    throw new Error("Không tạo được app shell");
  }

  return {
    gameCanvasId,
    setConnectionStatus(status: string): void {
      connectionElement.textContent = status;
    },
    setEnvironment(httpUrl: string, wsUrl: string): void {
      httpElement.textContent = httpUrl;
      wsElement.textContent = wsUrl;
    },
  };
}
