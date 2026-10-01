import { api } from './api.js';

export function escapeHtml(str) {
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

// Tách text thành các đoạn <p> (ngăn cách bởi dòng trống), giữ xuống dòng đơn.
function paragraphs(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

// Nội dung từ editor đã là HTML (backend lọc an toàn) -> dùng trực tiếp.
// Nếu là text thuần (dữ liệu cũ) -> tách đoạn.
function renderBody(text) {
  const s = String(text || '');
  if (/<[a-z][\s\S]*>/i.test(s)) return s;
  return paragraphs(s);
}

// Mỗi dòng thành một mục <li>.
function bullets(text) {
  return String(text || '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => `<li>${escapeHtml(l)}</li>`)
    .join('');
}

export function renderAbout(el, data) {
  if (!data) return; // giữ nội dung tĩnh mặc định trong HTML
  el.innerHTML = `
    <h1 class="page-title">${escapeHtml(data.title || 'Giới thiệu')}</h1>
    <section class="content-section rte">${renderBody(data.body)}</section>`;
}

export function renderRewards(el, data) {
  if (!data) return;
  const prizes = (data.prizes || [])
    .map(
      p => `
      <div class="prize-card">
        <div class="prize-rank">${escapeHtml(p.place)}</div>
        <div class="prize-amount">${escapeHtml(p.amount)}</div>
      </div>`
    )
    .join('');

  el.innerHTML = `
    <h1 class="page-title">${escapeHtml(data.title || 'Phần thưởng')}</h1>
    <section class="content-section cta-section">
      ${paragraphs(data.intro)}
      <div class="prize-grid">${prizes}</div>
      <p class="cta-note"><a href="index.html">Đăng nhập &amp; chơi ngay →</a></p>
    </section>
    <section class="content-section">
      <h2>Thể lệ</h2>
      <ul class="howto-list">${bullets(data.rules)}</ul>
      <p><strong>Liên hệ nhận thưởng:</strong> ${escapeHtml(data.contact)}</p>
    </section>`;
}

export function renderHome(el, data) {
  if (!data || (!data.title && !data.body)) {
    el.style.display = 'none';
    return;
  }
  el.innerHTML = `
    ${data.title ? `<h2>${escapeHtml(data.title)}</h2>` : ''}
    <div class="rte">${renderBody(data.body)}</div>`;
}

/** Tải nội dung từ API và render; nếu lỗi thì giữ nội dung tĩnh sẵn có. */
export async function initContentPage(key, el, renderer) {
  try {
    const { data } = await api.getContent(key);
    renderer(el, data);
  } catch {
    /* giữ nội dung mặc định trong HTML */
  }
}
