import { LogicEvent } from "../../legacy/common/logic-event";
import { EventMgr } from "../../legacy/events/event-manager";
import { LoginCommand } from "../../legacy/login/login-command";
import { LocalCache } from "../../legacy/utils/local-cache";

export function createLoginPanel(
  command: LoginCommand,
): HTMLElement {
  const panel = document.createElement("section");
  panel.className = "game-panel auth-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-labelledby", "login-title");

  panel.innerHTML = `
    <header class="game-panel__header">
      <h2 id="login-title" class="game-panel__title">Đăng nhập</h2>
    </header>

    <div class="game-panel__body">
      <p class="panel-intro">
        Đăng nhập tài khoản hiện có hoặc đăng ký nhanh để bắt đầu chinh chiến.
      </p>

      <form class="game-form" data-form="login" novalidate>
        <label class="form-field">
          <span class="form-field__label">Tài khoản</span>
          <input
            class="game-input"
            name="username"
            type="text"
            inputmode="text"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            maxlength="20"
            required
          />
        </label>

        <label class="form-field">
          <span class="form-field__label">Mật khẩu</span>
          <input
            class="game-input"
            name="password"
            type="password"
            autocomplete="current-password"
            maxlength="72"
            required
          />
        </label>

        <div class="game-button-row">
          <button
            class="game-button"
            type="button"
            data-action="register"
          >
            Đăng ký
          </button>
          <button
            class="game-button game-button--primary"
            type="submit"
          >
            Đăng nhập
          </button>
        </div>
      </form>

      <p class="form-hint">
        Client chỉ lưu tên tài khoản và mã thiết bị; mật khẩu không được lưu trên máy.
      </p>
    </div>
  `;

  const form = panel.querySelector<HTMLFormElement>(
    '[data-form="login"]',
  );
  const usernameInput = panel.querySelector<HTMLInputElement>(
    'input[name="username"]',
  );
  const passwordInput = panel.querySelector<HTMLInputElement>(
    'input[name="password"]',
  );
  const registerButton = panel.querySelector<HTMLButtonElement>(
    '[data-action="register"]',
  );

  if (!form || !usernameInput || !passwordInput || !registerButton) {
    throw new Error("Không tạo được form đăng nhập");
  }

  usernameInput.value =
    LocalCache.getLoginValidation()?.username ?? "";

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      EventMgr.emit(
        LogicEvent.showToast,
        "Vui lòng nhập đầy đủ tài khoản và mật khẩu.",
      );
      return;
    }

    EventMgr.emit(LogicEvent.showWaiting);
    command.accountLogin(username, password);
  });

  registerButton.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      EventMgr.emit(
        LogicEvent.showToast,
        "Vui lòng nhập đầy đủ tài khoản và mật khẩu.",
      );
      return;
    }

    const usernameLength = Array.from(username).length;
    if (usernameLength < 3 || usernameLength > 20) {
      EventMgr.emit(
        LogicEvent.showToast,
        "Tài khoản phải có từ 3 đến 20 ký tự.",
      );
      return;
    }

    const passwordBytes = new TextEncoder()
      .encode(password)
      .length;

    if (passwordBytes < 8 || passwordBytes > 72) {
      EventMgr.emit(
        LogicEvent.showToast,
        "Mật khẩu phải có từ 8 đến 72 byte.",
      );
      return;
    }

    EventMgr.emit(LogicEvent.showWaiting);
    command.register(username, password);
  });

  window.setTimeout(() => {
    (usernameInput.value ? passwordInput : usernameInput).focus();
  }, 0);

  return panel;
}
