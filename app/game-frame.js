// Điều khiển khung game ở trang /games/<slug>.
// - Tạo iframe bằng JS thay vì render sẵn: desktop/Android tự chạy ngay; iOS chờ
//   người dùng chạm "Bấm để chơi" (nạp trong cử chỉ người dùng -> Safari dễ cho
//   game nặng khởi động hơn). Mọi thứ VẪN ở trong trang, không mở tab mới.
// - Nút "Tải lại game": nạp lại iframe tại chỗ nếu game lỗi.
// - Nút "Toàn màn hình": Fullscreen API thật (Android/máy tính) + khóa xoay ngang
//   nếu game cần; iOS Safari không hỗ trợ -> phủ kín màn hình bằng CSS (pseudo).
// - Lớp phủ "xoay máy" do CSS tự hiện khi màn dọc + game .needs-landscape.
(function () {
  function isIOS() {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }

  function buildIframe(frame) {
    var url = frame.getAttribute('data-embed');
    if (!url) return null;
    var ifr = document.createElement('iframe');
    ifr.src = url;
    ifr.title = frame.getAttribute('data-title') || '';
    ifr.setAttribute('allowfullscreen', '');
    ifr.setAttribute('scrolling', 'no');
    ifr.setAttribute(
      'allow',
      'autoplay; fullscreen; gamepad; accelerometer; gyroscope'
    );
    return ifr;
  }

  function removePoster(frame) {
    var poster = frame.querySelector('.game-play-poster');
    if (poster) poster.remove();
  }

  function startGame(frame) {
    if (frame.querySelector('iframe')) return; // đã chạy
    var ifr = buildIframe(frame);
    if (!ifr) return;
    frame.insertBefore(ifr, frame.firstChild);
    removePoster(frame);
  }

  function reloadGame(frame) {
    var old = frame.querySelector('iframe');
    if (old) old.remove();
    var ifr = buildIframe(frame);
    if (ifr) frame.insertBefore(ifr, frame.firstChild);
    removePoster(frame);
  }

  // --- Fullscreen helpers ---
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
      /* không hỗ trợ */
    }
  }
  function unlockOrientation() {
    try {
      if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
    } catch (e) {
      /* bỏ qua */
    }
  }

  var frame = document.querySelector('.game-frame');
  if (!frame) return;

  // Bấm ảnh poster = chơi (nạp iframe trong cử chỉ người dùng).
  var poster = frame.querySelector('.game-play-poster');
  if (poster) poster.addEventListener('click', function () { startGame(frame); });

  // Desktop/Android: tự chạy ngay để khỏi phải bấm thêm. iOS: chờ người dùng chạm.
  if (!isIOS()) startGame(frame);

  var reloadBtn = document.querySelector('.game-reload-btn');
  if (reloadBtn) reloadBtn.addEventListener('click', function () { reloadGame(frame); });

  var fsBtn = document.querySelector('.game-fs-btn');
  if (fsBtn) {
    var needsLS = frame.classList.contains('needs-landscape');
    fsBtn.addEventListener('click', function () {
      startGame(frame); // đảm bảo game đã nạp
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
  }

  var exitBtn = frame.querySelector('.game-fs-exit');
  if (exitBtn) {
    exitBtn.addEventListener('click', function () {
      frame.classList.remove('pseudo-fs');
      document.body.classList.remove('fs-lock');
    });
  }

  function onFsChange() {
    if (!fsElement()) unlockOrientation();
  }
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);
})();
