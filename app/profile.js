import { api } from './api.js';

const el = document.getElementById('profile');

function escapeHtml(str) {
  return String(str ?? '').replace(
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

/** Nhãn trạng thái nhận thưởng cho một tháng lọt top. */
function winnerStatus(w) {
  if (w.awarded) return '<span class="claim-tag claim-done">✓ Đã trao thưởng</span>';
  if (w.claimed)
    return '<span class="claim-tag claim-wait">Đã gửi thông tin, chờ trao</span>';
  return '<span class="claim-tag claim-todo">Chưa điền thông tin</span>';
}

/** Dòng lịch sử một tháng. */
function historyRow(h) {
  const medal = h.winner ? ['🥇', '🥈', '🥉'][h.winner.rank - 1] || '' : '';
  const rankCell = h.winner ? `${medal} Top ${h.winner.rank}` : '—';

  let action = '';
  if (h.winner) {
    const amount = h.winner.rewardAmount
      ? ` <small>(${escapeHtml(h.winner.rewardAmount)})</small>`
      : '';
    action = `<div class="claim-cell">${winnerStatus(h.winner)}${amount}`;
    if (h.winner.canClaim) {
      action += `<button class="auth-btn claim-btn" data-month="${escapeHtml(
        h.monthKey
      )}">${h.winner.claimed ? 'Sửa thông tin' : 'Điền thông tin nhận thưởng'}</button>`;
    }
    action += '</div>';
  }

  return `
    <tr>
      <td>${escapeHtml(h.label)}</td>
      <td class="lb-score">${h.bestScore}</td>
      <td>${h.gamesPlayed}</td>
      <td>${rankCell}</td>
      <td>${action}</td>
    </tr>`;
}

async function renderHistory(container) {
  let history = [];
  try {
    ({ history } = await api.myHistory());
  } catch {
    container.innerHTML =
      '<p class="lb-empty">Không tải được lịch sử theo tháng.</p>';
    return;
  }

  if (!history.length) {
    container.innerHTML =
      '<p class="lb-empty">Bạn chưa có dữ liệu tháng nào. Hãy chơi để ghi điểm!</p>';
    return;
  }

  container.innerHTML = `
    <h2 class="profile-section-title">Lịch sử theo tháng</h2>
    <table class="lb-table history-table">
      <thead>
        <tr><th>Tháng</th><th>Kỷ lục</th><th>Số ván</th><th>Hạng</th><th>Nhận thưởng</th></tr>
      </thead>
      <tbody>${history.map(historyRow).join('')}</tbody>
    </table>`;

  container.querySelectorAll('.claim-btn').forEach(btn => {
    btn.addEventListener('click', () => openClaimForm(btn.dataset.month));
  });
}

/** Form điền thông tin nhận thưởng (hiện trong hộp modal đơn giản). */
function openClaimForm(monthKey) {
  const overlay = document.createElement('div');
  overlay.className = 'claim-overlay';
  overlay.innerHTML = `
    <form class="claim-form" id="claim-form">
      <h3>Thông tin nhận thưởng — tháng ${escapeHtml(monthKey)}</h3>
      <p class="claim-hint">Thông tin này chỉ ban tổ chức (admin) xem được để chuyển thưởng.</p>
      <label>Họ và tên <span class="req">*</span>
        <input id="cl-name" maxlength="100" required />
      </label>
      <label>Số điện thoại
        <input id="cl-phone" maxlength="30" inputmode="tel" />
      </label>
      <label>Ngân hàng <span class="req">*</span>
        <input id="cl-bank" maxlength="100" placeholder="VD: Vietcombank" required />
      </label>
      <label>Số tài khoản <span class="req">*</span>
        <input id="cl-acc" maxlength="50" inputmode="numeric" required />
      </label>
      <label>Ghi chú
        <textarea id="cl-note" rows="2" maxlength="300"></textarea>
      </label>
      <p class="auth-msg" id="cl-msg"></p>
      <div class="claim-actions">
        <button type="submit" class="auth-btn">Gửi thông tin</button>
        <button type="button" class="auth-btn auth-btn-ghost" id="cl-cancel">Hủy</button>
      </div>
    </form>`;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#cl-cancel').addEventListener('click', close);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });

  overlay.querySelector('#claim-form').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = overlay.querySelector('#cl-msg');
    msg.textContent = 'Đang gửi…';
    msg.classList.remove('auth-msg-error');
    try {
      await api.submitClaim({
        monthKey,
        fullName: overlay.querySelector('#cl-name').value,
        phone: overlay.querySelector('#cl-phone').value,
        bankName: overlay.querySelector('#cl-bank').value,
        bankAccount: overlay.querySelector('#cl-acc').value,
        note: overlay.querySelector('#cl-note').value,
      });
      close();
      render(); // tải lại hồ sơ để cập nhật trạng thái
    } catch (err) {
      msg.textContent = err.message;
      msg.classList.add('auth-msg-error');
    }
  });
}

async function render() {
  el.innerHTML = '<p class="lb-empty">Đang tải hồ sơ…</p>';

  let me;
  try {
    const res = await api.me();
    me = res.user;
  } catch (err) {
    if (err.banned) {
      el.innerHTML = `
        <div class="profile-card">
          <div class="profile-avatar">🚫</div>
          <p>${escapeHtml(err.message)}</p>
          <p><a class="auth-btn" href="index.html">Về trang chủ</a></p>
        </div>`;
      return;
    }
    el.innerHTML = `
      <div class="profile-card">
        <div class="profile-avatar">🦖</div>
        <p>Bạn chưa đăng nhập.</p>
        <p><a class="auth-btn" href="index.html">Đăng nhập ở trang chơi →</a></p>
      </div>`;
    return;
  }

  // Lấy hạng THÁNG HIỆN TẠI từ bảng xếp hạng.
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
          <div class="stat-label">Kỷ lục cao nhất</div>
        </div>
        <div class="stat">
          <div class="stat-num">${rank ? '#' + rank : '—'}</div>
          <div class="stat-label">Hạng tháng này</div>
        </div>
        <div class="stat">
          <div class="stat-num">${me.gamesPlayed}</div>
          <div class="stat-label">Tổng số ván</div>
        </div>
      </div>
      <div class="profile-actions">
        <a class="auth-btn auth-btn-ghost" href="index.html">Chơi tiếp</a>
        ${me.isAdmin ? '<a class="auth-btn" href="admin.html">Trang quản trị</a>' : ''}
        <button class="auth-btn auth-logout" id="profile-logout">Đăng xuất</button>
      </div>
    </div>
    <div class="profile-history" id="profile-history">
      <p class="lb-empty">Đang tải lịch sử…</p>
    </div>`;

  renderHistory(document.getElementById('profile-history'));

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
