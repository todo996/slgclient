import { LogicEvent } from "../../legacy/common/logic-event";
import { EventMgr } from "../../legacy/events/event-manager";
import { createName } from "../../legacy/libs/name-dict";
import { LoginCommand } from "../../legacy/login/login-command";

export function createRolePanel(
  command: LoginCommand,
): HTMLElement {
  const panel = document.createElement("section");
  panel.className = "game-panel auth-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-labelledby", "create-role-title");

  panel.innerHTML = `
    <header class="game-panel__header">
      <h2 id="create-role-title" class="game-panel__title">Tạo nhân vật</h2>
    </header>

    <div class="game-panel__body">
      <p class="panel-intro">
        Chọn danh xưng và giới tính cho chủ công trước khi tiến vào bản đồ.
      </p>

      <form class="game-form" data-form="create-role" novalidate>
        <label class="form-field">
          <span class="form-field__label">Tên nhân vật</span>
          <div class="input-with-action">
            <input
              class="game-input"
              name="nickname"
              type="text"
              autocomplete="off"
              maxlength="20"
              required
            />
            <button
              class="game-button game-button--compact"
              type="button"
              data-action="random-name"
            >
              Đổi tên
            </button>
          </div>
        </label>

        <fieldset class="gender-fieldset">
          <legend>Giới tính</legend>
          <div class="gender-options">
            <label class="gender-option">
              <input type="radio" name="sex" value="0" checked />
              <span>Nam</span>
            </label>
            <label class="gender-option">
              <input type="radio" name="sex" value="1" />
              <span>Nữ</span>
            </label>
          </div>
        </fieldset>

        <button
          class="game-button game-button--primary game-button--wide"
          type="submit"
        >
          Tiến vào thiên hạ
        </button>
      </form>
    </div>
  `;

  const form = panel.querySelector<HTMLFormElement>(
    '[data-form="create-role"]',
  );
  const nicknameInput = panel.querySelector<HTMLInputElement>(
    'input[name="nickname"]',
  );
  const randomButton = panel.querySelector<HTMLButtonElement>(
    '[data-action="random-name"]',
  );

  if (!form || !nicknameInput || !randomButton) {
    throw new Error("Không tạo được form tạo nhân vật");
  }

  const selectedSex = (): 0 | 1 => {
    const selected = panel.querySelector<HTMLInputElement>(
      'input[name="sex"]:checked',
    );
    return selected?.value === "1" ? 1 : 0;
  };

  const randomizeName = (): void => {
    nicknameInput.value = createName(
      selectedSex() === 1 ? "girl" : "boy",
    );
  };

  randomizeName();
  randomButton.addEventListener("click", randomizeName);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nickname = nicknameInput.value.trim();
    if (!nickname) {
      EventMgr.emit(
        LogicEvent.showToast,
        "Vui lòng nhập tên nhân vật.",
      );
      return;
    }

    const loginData = command.proxy.getLoginData();
    if (loginData?.uid === undefined) {
      EventMgr.emit(
        LogicEvent.showToast,
        "Không tìm thấy thông tin tài khoản để tạo nhân vật.",
      );
      return;
    }

    EventMgr.emit(LogicEvent.showWaiting);
    command.roleCreate(
      loginData.uid,
      nickname,
      selectedSex(),
      command.proxy.serverId,
      0,
    );
  });

  window.setTimeout(() => nicknameInput.focus(), 0);
  return panel;
}
