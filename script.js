import { Runner } from './resources/dino_game/offline.js';
import {
  initAuth,
  getCurrentUser,
  updateBestScore,
} from './app/auth.js';
import { initLeaderboard, loadLeaderboard } from './app/leaderboard.js';

window.addEventListener('load', async () => {
  const trexGameContainer = document.querySelector('.trex-game');

  const runner = new Runner(trexGameContainer);

  //   Bấm 'F' để BẬT/TẮT chế độ toàn màn hình (arcade).
  //   Toàn bộ bố cục do CSS xử lý (class 'arcade-mode'): game to lên & nằm giữa,
  //   tiêu đề + đăng nhập + bảng xếp hạng vẫn hiển thị, không đè nhau.
  document.addEventListener('keydown', event => {
    if (event.key && event.key.toLowerCase() === 'f') {
      document.body.classList.toggle('arcade-mode');
    }
  });

  // --- Đăng nhập + Bảng xếp hạng (thêm mới, không đụng vào game) ---
  const accountBox = document.getElementById('account-box');
  const leaderboardBox = document.getElementById('leaderboard-box');

  initLeaderboard(leaderboardBox);

  // Mỗi khi đăng nhập/đăng xuất -> tải lại bảng xếp hạng và tô đậm dòng của mình.
  await initAuth(accountBox, {
    onAuthChange: user => loadLeaderboard(user?.username),
  });

  // Khi game over: nếu đã đăng nhập thì gửi điểm và làm mới bảng xếp hạng.
  document.addEventListener('game-over', async event => {
    const score = event.detail?.score ?? 0;
    const user = getCurrentUser();
    if (!user) return; // Guest vẫn xem được top nhưng không lưu điểm.

    try {
      const { bestScore } = await runnerSubmit(score);
      updateBestScore(bestScore);
      await loadLeaderboard(user.username);
    } catch (err) {
      console.warn('Không gửi được điểm:', err.message);
    }
  });
});

// Tách riêng để dễ đọc; import động tránh phải nạp api khi chưa cần.
async function runnerSubmit(score) {
  const { api } = await import('./app/api.js');
  return api.submitScore(score);
}
