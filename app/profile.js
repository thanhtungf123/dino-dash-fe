import { api } from './api.js';

const el = document.getElementById('profile');

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

async function render() {
  el.innerHTML = '<p class="lb-empty">Đang tải hồ sơ…</p>';

  let me;
  try {
    const res = await api.me();
    me = res.user;
  } catch {
    el.innerHTML = `
      <div class="profile-card">
        <div class="profile-avatar">🦖</div>
        <p>Bạn chưa đăng nhập.</p>
        <p><a class="auth-btn" href="index.html">Đăng nhập ở trang chơi →</a></p>
      </div>`;
    return;
  }

  // Lấy hạng từ bảng xếp hạng.
  let rank = null;
  try {
    const lb = await api.leaderboard();
    rank = lb.me?.rank ?? null;
  } catch {
    /* bỏ qua nếu không lấy được hạng */
  }

  el.innerHTML = `
    <div class="profile-card">
      <div class="profile-avatar">🦖</div>
      <h2 class="profile-name">${escapeHtml(me.username)}</h2>
      <div class="profile-stats">
        <div class="stat">
          <div class="stat-num">${me.bestScore}</div>
          <div class="stat-label">Kỷ lục</div>
        </div>
        <div class="stat">
          <div class="stat-num">${rank ? '#' + rank : '—'}</div>
          <div class="stat-label">Hạng</div>
        </div>
        <div class="stat">
          <div class="stat-num">${me.gamesPlayed}</div>
          <div class="stat-label">Số ván</div>
        </div>
      </div>
      <div class="profile-actions">
        <a class="auth-btn auth-btn-ghost" href="index.html">Chơi tiếp</a>
        ${me.isAdmin ? '<a class="auth-btn" href="admin.html">Trang quản trị</a>' : ''}
        <button class="auth-btn auth-logout" id="profile-logout">Đăng xuất</button>
      </div>
    </div>`;

  document
    .getElementById('profile-logout')
    .addEventListener('click', async () => {
      try {
        await api.logout();
      } catch {
        /* bỏ qua */
      }
      render();
    });
}

render();
