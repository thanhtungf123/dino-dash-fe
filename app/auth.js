import { api } from './api.js';

let boxEl = null;
let onChange = null;
let currentUser = null;

// Chế độ form: 'login' hoặc 'register'.
let authMode = 'login';

export function getCurrentUser() {
  return currentUser;
}

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    ch =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[ch]
  );
}

/** Màn hình khi tài khoản bị cấm do gian lận. */
function renderBanned(message) {
  currentUser = null;
  boxEl.innerHTML = `
    <div class="auth-banned">
      <div class="auth-banned-icon">🚫</div>
      <p class="auth-banned-msg">${escapeHtml(
        message || 'Tài khoản của bạn đã bị cấm khỏi hệ thống do gian lận điểm.'
      )}</p>
      <button type="button" class="auth-btn auth-btn-ghost" id="auth-banned-ok">Đã hiểu</button>
    </div>`;
  boxEl.querySelector('#auth-banned-ok').addEventListener('click', () => {
    authMode = 'login';
    renderLoggedOut();
  });
  onChange?.(null);
}

function renderLoggedIn() {
  boxEl.innerHTML = `
    <div class="auth-status">
      <span class="auth-hello">Xin chào, <strong>${escapeHtml(
        currentUser.username
      )}</strong> · Kỷ lục: <strong>${currentUser.bestScore}</strong></span>
      <button type="button" class="auth-btn auth-logout" id="auth-logout">Đăng xuất</button>
    </div>`;

  boxEl.querySelector('#auth-logout').addEventListener('click', handleLogout);
}

function renderLoggedOut(prefill = {}) {
  const isRegister = authMode === 'register';
  const title = isRegister ? 'Đăng ký để lưu điểm' : 'Đăng nhập để lưu điểm';
  const submitLabel = isRegister ? 'Xác nhận đăng ký' : 'Đăng nhập';
  const togglePrompt = isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?';
  const toggleLabel = isRegister ? 'Đăng nhập' : 'Đăng ký';

  const confirmField = isRegister
    ? `<input class="auth-input" id="auth-confirm" type="password"
         placeholder="Nhập lại mật khẩu" autocomplete="new-password"
         value="${escapeHtml(prefill.confirm || '')}" />`
    : '';

  boxEl.innerHTML = `
    <form class="auth-form" id="auth-form">
      <h2 class="auth-title">${title}</h2>
      <div class="auth-fields">
        <input class="auth-input" id="auth-username" type="text"
          placeholder="Tên đăng nhập" autocomplete="username" maxlength="20"
          value="${escapeHtml(prefill.username || '')}" />
        <input class="auth-input" id="auth-password" type="password"
          placeholder="Mật khẩu"
          autocomplete="${isRegister ? 'new-password' : 'current-password'}"
          value="${escapeHtml(prefill.password || '')}" />
        ${confirmField}
      </div>
      <label class="auth-show">
        <input type="checkbox" id="auth-showpw" /> Hiện mật khẩu
      </label>
      <div class="auth-actions">
        <button type="submit" class="auth-btn" id="auth-submit-btn">${submitLabel}</button>
      </div>
      <p class="auth-switch">
        ${togglePrompt}
        <button type="button" class="auth-link" id="auth-toggle">${toggleLabel}</button>
      </p>
      <p class="auth-msg" id="auth-msg"></p>
    </form>`;

  const form = boxEl.querySelector('#auth-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    handleSubmit(authMode);
  });

  // Chuyển Đăng nhập <-> Đăng ký, giữ lại thông tin đã nhập.
  boxEl.querySelector('#auth-toggle').addEventListener('click', () => {
    const username = boxEl.querySelector('#auth-username').value;
    const password = boxEl.querySelector('#auth-password').value;
    const confirmEl = boxEl.querySelector('#auth-confirm');
    authMode = isRegister ? 'login' : 'register';
    renderLoggedOut({
      username,
      password,
      confirm: confirmEl ? confirmEl.value : '',
    });
  });

  // Hiện/ẩn mật khẩu.
  boxEl.querySelector('#auth-showpw').addEventListener('change', e => {
    const type = e.target.checked ? 'text' : 'password';
    boxEl
      .querySelectorAll('#auth-password, #auth-confirm')
      .forEach(inp => (inp.type = type));
  });
}

function setMsg(text, isError = true) {
  const msgEl = boxEl.querySelector('#auth-msg');
  if (msgEl) {
    msgEl.textContent = text;
    msgEl.classList.toggle('auth-msg-error', isError);
  }
}

function setBusy(busy) {
  boxEl.querySelectorAll('button, input').forEach(el => (el.disabled = busy));
}

async function handleSubmit(mode) {
  const username = boxEl.querySelector('#auth-username').value.trim();
  const password = boxEl.querySelector('#auth-password').value;

  if (!username || !password) {
    setMsg('Vui lòng nhập đủ tên đăng nhập và mật khẩu.');
    return;
  }
  if (mode === 'register') {
    const confirm = boxEl.querySelector('#auth-confirm').value;
    if (password !== confirm) {
      setMsg('Mật khẩu nhập lại không khớp.');
      return;
    }
  }

  const submitBtn = boxEl.querySelector('#auth-submit-btn');
  const originalLabel = submitBtn.textContent;
  submitBtn.textContent = 'Đang xử lý...';
  setBusy(true);

  try {
    const { user } =
      mode === 'register'
        ? await api.register(username, password)
        : await api.login(username, password);
    currentUser = user;
    renderLoggedIn();
    onChange?.(currentUser);
  } catch (err) {
    if (err.banned) {
      renderBanned(err.message);
      return;
    }
    setBusy(false);
    submitBtn.textContent = originalLabel;
    setMsg(err.message);
  }
}

async function handleLogout() {
  try {
    await api.logout();
  } catch {
    // bỏ qua lỗi mạng khi đăng xuất
  }
  currentUser = null;
  authMode = 'login';
  renderLoggedOut();
  onChange?.(null);
}

/** Cập nhật bestScore hiển thị sau khi gửi điểm mới (không gọi lại API). */
export function updateBestScore(bestScore) {
  if (currentUser) {
    currentUser.bestScore = bestScore;
    if (boxEl.querySelector('.auth-status')) {
      renderLoggedIn();
    }
  }
}

/**
 * Khởi tạo khối đăng nhập. Tự kiểm tra phiên hiện có (cookie) qua /auth/me.
 * @param {HTMLElement} el
 * @param {{ onAuthChange?: (user: object|null) => void }} opts
 */
export async function initAuth(el, { onAuthChange } = {}) {
  boxEl = el;
  onChange = onAuthChange;

  try {
    const { user } = await api.me();
    currentUser = user;
    renderLoggedIn();
  } catch (err) {
    currentUser = null;
    if (err.banned) {
      renderBanned(err.message);
      return; // renderBanned đã gọi onChange(null)
    }
    renderLoggedOut();
  }
  onChange?.(currentUser);
}
