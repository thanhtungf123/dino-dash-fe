// Nút "Toàn màn hình" cho game nhúng ở trang /games/<slug>.
// Game hiển thị trực tiếp trong iframe. Nút chỉ xử lý fullscreen:
// - Android/máy tính: Fullscreen API thật; nếu game cần màn hình ngang thì
//   khóa xoay ngang (screen.orientation.lock) — Safari iOS KHÔNG hỗ trợ.
// - iOS/Safari: không fullscreen <div> được -> phủ kín viewport bằng CSS (pseudo).
// Lớp phủ "xoay máy" do CSS tự hiện khi màn dọc + game .needs-landscape.
(function () {
  function requestReal(el) {
    if (el.requestFullscreen) return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    return null;
  }
  function fsElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }
  function realSupported(el) {
    return !!(el.requestFullscreen || el.webkitRequestFullscreen);
  }
  function lockLandscape() {
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(function () {});
      }
    } catch (e) {
      /* không hỗ trợ -> bỏ qua */
    }
  }
  function unlockOrientation() {
    try {
      if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
    } catch (e) {
      /* bỏ qua */
    }
  }

  document.querySelectorAll('.game-fs-btn').forEach(function (btn) {
    var frame = document.getElementById(btn.getAttribute('data-fs-target'));
    if (!frame) return;
    var needsLS = frame.classList.contains('needs-landscape');

    btn.addEventListener('click', function () {
      if (realSupported(frame)) {
        var p = requestReal(frame);
        if (needsLS) {
          if (p && p.then) p.then(lockLandscape, lockLandscape);
          else lockLandscape();
        }
      } else {
        // iOS: phủ kín màn hình bằng CSS
        frame.classList.add('pseudo-fs');
        document.body.classList.add('fs-lock');
      }
    });

    var exitBtn = frame.querySelector('.game-fs-exit');
    if (exitBtn) {
      exitBtn.addEventListener('click', function () {
        frame.classList.remove('pseudo-fs');
        document.body.classList.remove('fs-lock');
      });
    }
  });

  function onFsChange() {
    if (!fsElement()) unlockOrientation();
  }
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);
})();
