import { api } from './api.js';

let boxEl = null;

/** Escape để tránh XSS khi hiển thị tên người dùng. */
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

function render(list, currentUsername) {
  if (!list.length) {
    boxEl.innerHTML = `
      <h2 class="lb-title">Bảng xếp hạng</h2>
      <p class="lb-empty">Chưa có ai ghi điểm. Hãy là người đầu tiên!</p>`;
    return;
  }

  const rows = list
    .map((entry, i) => {
      const rank = i + 1;
      const medal = ['🥇', '🥈', '🥉'][i] || rank;
      const isMe = currentUsername && entry.username === currentUsername;
      return `
        <tr class="${isMe ? 'lb-me' : ''}">
          <td class="lb-rank">${medal}</td>
          <td class="lb-name">${escapeHtml(entry.username)}</td>
          <td class="lb-score">${entry.bestScore}</td>
        </tr>`;
    })
    .join('');

  boxEl.innerHTML = `
    <h2 class="lb-title">Bảng xếp hạng — Top 10</h2>
    <table class="lb-table">
      <thead>
        <tr><th>#</th><th>Người chơi</th><th>Điểm</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/**
 * Tải và hiển thị bảng xếp hạng.
 * @param {string=} currentUsername Tô đậm dòng của người đang đăng nhập.
 */
export async function loadLeaderboard(currentUsername) {
  if (!boxEl) return;
  try {
    const { leaderboard } = await api.leaderboard();
    render(leaderboard, currentUsername);
  } catch (err) {
    boxEl.innerHTML = `
      <h2 class="lb-title">Bảng xếp hạng</h2>
      <p class="lb-empty">Không tải được bảng xếp hạng (${escapeHtml(
        err.message
      )}).</p>`;
  }
}

export function initLeaderboard(el) {
  boxEl = el;
}
