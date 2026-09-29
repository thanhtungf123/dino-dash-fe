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

function render(list, me) {
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
      const isMe = me && entry.username === me.username;
      return `
        <tr class="${isMe ? 'lb-me' : ''}">
          <td class="lb-rank">${medal}</td>
          <td class="lb-name">${escapeHtml(entry.username)}</td>
          <td class="lb-score">${entry.bestScore}</td>
        </tr>`;
    })
    .join('');

  // Nếu người chơi đã có điểm nhưng KHÔNG nằm trong Top 10 -> hiện hạng riêng.
  const inTop = me && list.some(e => e.username === me.username);
  const myRankRow =
    me && me.rank && !inTop
      ? `
        <tr class="lb-me lb-me-row">
          <td class="lb-rank">#${me.rank}</td>
          <td class="lb-name">${escapeHtml(me.username)} (bạn)</td>
          <td class="lb-score">${me.bestScore}</td>
        </tr>`
      : '';

  boxEl.innerHTML = `
    <h2 class="lb-title">Bảng xếp hạng — Top ${list.length}</h2>
    <table class="lb-table">
      <thead>
        <tr><th>#</th><th>Người chơi</th><th>Điểm</th></tr>
      </thead>
      <tbody>${rows}${myRankRow}</tbody>
    </table>`;
}

/** Tải và hiển thị bảng xếp hạng (backend tự nhận biết bạn qua cookie). */
export async function loadLeaderboard(limit) {
  if (!boxEl) return;
  try {
    const { leaderboard, me } = await api.leaderboard(limit);
    render(leaderboard, me);
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
