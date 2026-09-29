import { Runner } from './resources/dino_game/offline.js';
import { initAuth, getCurrentUser, updateBestScore } from './app/auth.js';
import { initLeaderboard, loadLeaderboard } from './app/leaderboard.js';
import { api } from './app/api.js';

window.addEventListener('load', async () => {
  const trexGameContainer = document.querySelector('.trex-game');

  const runner = new Runner(trexGameContainer);

  //   Bấm 'F' để BẬT/TẮT chế độ toàn màn hình (arcade).
  document.addEventListener('keydown', event => {
    if (event.key && event.key.toLowerCase() === 'f') {
      document.body.classList.toggle('arcade-mode');
    }
  });

  // --- Nút điều khiển cho mobile ---
  // Game lắng nghe keydown/keyup, nên nút chỉ cần phát ra sự kiện phím tương ứng.
  const sendKey = (type, keyCode) =>
    document.dispatchEvent(new KeyboardEvent(type, { keyCode, bubbles: true }));

  // Giữ nút = giữ phím (nhảy cao hơn / cúi lâu hơn); thả ra = nhả phím.
  const bindHold = (btn, keyCode) => {
    if (!btn) return;
    const press = e => {
      e.preventDefault();
      sendKey('keydown', keyCode);
    };
    const release = e => {
      e.preventDefault();
      sendKey('keyup', keyCode);
    };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('pointercancel', release);
  };

  bindHold(document.getElementById('btn-jump'), 38); // Mũi tên lên
  bindHold(document.getElementById('btn-duck'), 40); // Mũi tên xuống

  // Nút Bắt đầu / Chơi lại — luôn hiện, tự đổi nhãn & hành vi theo trạng thái game.
  const actionBtn = document.getElementById('game-action');
  let isGameOver = false;
  const setAction = mode => {
    if (mode === 'hide') {
      actionBtn.style.display = 'none';
      return;
    }
    actionBtn.style.display = '';
    isGameOver = mode === 'restart';
    actionBtn.textContent = isGameOver ? '↻ Chơi lại' : '▶ Bắt đầu';
  };
  actionBtn.addEventListener('click', () => {
    if (isGameOver) {
      sendKey('keydown', 13); // Enter = chơi lại
      sendKey('keyup', 13);
    } else {
      sendKey('keydown', 32); // Space = bắt đầu
      sendKey('keyup', 32);
    }
  });
  // Đang chơi -> ẩn; thua -> hiện "Chơi lại"; ban đầu -> "Bắt đầu".
  document.addEventListener('game-start', () => setAction('hide'));
  document.addEventListener('game-over', () => setAction('restart'));
  setAction('start');

  // --- Đăng nhập + Bảng xếp hạng (thêm mới, không đụng vào game) ---
  const accountBox = document.getElementById('account-box');
  const leaderboardBox = document.getElementById('leaderboard-box');

  initLeaderboard(leaderboardBox);

  // Mỗi khi đăng nhập/đăng xuất -> tải lại bảng xếp hạng.
  await initAuth(accountBox, {
    onAuthChange: () => loadLeaderboard(),
  });

  // Session token cho anti-cheat: xin khi bắt đầu mỗi ván (nếu đã đăng nhập).
  let sessionToken = null;
  document.addEventListener('game-start', async () => {
    if (!getCurrentUser()) return;
    try {
      const res = await api.startSession();
      sessionToken = res.sessionToken;
    } catch {
      sessionToken = null; // vẫn nộp được nhưng bị giới hạn chặt hơn phía server
    }
  });

  // Khi game over: nếu đã đăng nhập thì gửi điểm (kèm session token) và làm mới bảng.
  document.addEventListener('game-over', async event => {
    const score = event.detail?.score ?? 0;
    if (!getCurrentUser()) return; // Guest vẫn xem được top nhưng không lưu điểm.

    try {
      const { bestScore } = await api.submitScore(score, sessionToken);
      updateBestScore(bestScore);
      sessionToken = null; // token dùng một lần cho mỗi ván
      await loadLeaderboard();
    } catch (err) {
      console.warn('Không gửi được điểm:', err.message);
    }
  });
});
