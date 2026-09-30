import { api } from './api.js';

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
