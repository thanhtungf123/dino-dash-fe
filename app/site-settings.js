import { api } from './api.js';

// --- Hamburger menu cho mobile: chèn nút ☰ và bật/tắt menu ---
(function setupHamburger() {
  document.querySelectorAll('.site-nav').forEach(nav => {
    const logo = nav.querySelector('.site-logo');
    const menu = nav.querySelector('.nav-menu');
    if (!menu || nav.querySelector('.nav-toggle')) return;

    const btn = document.createElement('button');
    btn.className = 'nav-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Mở menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '☰';
    if (logo) logo.insertAdjacentElement('afterend', btn);
    else nav.insertBefore(btn, menu);

    const close = () => {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '☰';
    };
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.innerHTML = open ? '✕' : '☰';
    });
    // Bấm vào 1 mục -> đóng menu.
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  });
})();

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

// Áp dụng logo / tên website / footer từ Cài đặt (admin) cho MỌI trang.
(async () => {
  let data;
  try {
    ({ data } = await api.getSettings());
  } catch {
    return; // lỗi mạng -> giữ nội dung tĩnh mặc định
  }
  if (!data) return;

  const siteName = data.siteName || 'Dino Dash';

  // Logo (nav): hiện ảnh logo KÈM tên website; nếu chưa có logo thì hiện tên (kèm emoji).
  document.querySelectorAll('.site-logo').forEach(el => {
    if (data.logoUrl) {
      el.innerHTML = `<img class="logo-img" src="${escapeHtml(
        data.logoUrl
      )}" alt="${escapeHtml(siteName)}" /><span class="logo-name">${escapeHtml(
        siteName
      )}</span>`;
    } else {
      el.innerHTML = `<span class="logo-name">🦖 ${escapeHtml(siteName)}</span>`;
    }
  });

  // Footer: copyright + giới thiệu ngắn + các liên kết.
  const footer = document.querySelector('.site-footer');
  if (footer) {
    const f = data.footer || {};
    let html = '';
    if (f.copyright) html += `<p>${escapeHtml(f.copyright)}</p>`;
    if (f.intro) html += `<p class="footer-intro">${escapeHtml(f.intro)}</p>`;
    const links = Array.isArray(f.links)
      ? f.links.filter(l => l.name && l.url)
      : [];
    if (links.length) {
      html +=
        '<p class="footer-links">' +
        links
          .map(l => `<a href="${escapeHtml(l.url)}">${escapeHtml(l.name)}</a>`)
          .join(' · ') +
        '</p>';
    }
    if (html) footer.innerHTML = html;
  }
})();
