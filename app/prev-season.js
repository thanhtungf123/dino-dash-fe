import { api } from './api.js';

/** Escape tránh XSS khi hiển thị tên người dùng. */
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

/**
 * Hiển thị Top 3 của THÁNG TRƯỚC (đã chốt) vào phần tử cho trước.
 * Nếu chưa có mùa nào được chốt thì ẩn khối đi.
 */
export async function loadPrevSeason(el) {
  if (!el) return;
  let season;
  try {
    ({ season } = await api.leaderboardPrevious());
  } catch {
    el.style.display = 'none';
    return;
  }

  if (!season || !season.winners || !season.winners.length) {
    el.style.display = 'none';
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  const rows = season.winners
    .map(
      w => `
        <tr>
          <td class="lb-rank">${medals[w.rank - 1] || w.rank}</td>
          <td class="lb-name">${escapeHtml(w.username)}</td>
          <td class="lb-score">${w.score}</td>
        </tr>`
    )
    .join('');

  el.style.display = '';
  el.innerHTML = `
    <h2 class="lb-title lb-prev-title">🏆 Top 3 tháng ${escapeHtml(season.label)}</h2>
    <table class="lb-table lb-prev-table">
      <tbody>${rows}</tbody>
    </table>`;
}
