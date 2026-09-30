import { api } from './api.js';

const root = document.getElementById('settings-root');

let state = null;

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

const $ = id => document.getElementById(id);

// --- Render ---
function imgBox(kind, url) {
  return `
    <div class="set-imgbox">
      <div class="set-preview" id="prev-${kind}">
        ${
          url
            ? `<img src="${escapeHtml(url)}" alt="${kind}" />`
            : '<span class="set-empty">Chưa có</span>'
        }
      </div>
      <div class="set-imgactions">
        <label class="auth-btn auth-btn-ghost set-uploadbtn">
          Tải ảnh lên
          <input type="file" id="file-${kind}" accept="image/*" hidden />
        </label>
        <button type="button" class="auth-btn auth-btn-ghost" id="del-${kind}">Xóa</button>
        <span class="admin-status" id="st-${kind}"></span>
      </div>
    </div>`;
}

function linksRows() {
  return state.footer.links
    .map(
      (l, i) => `
      <div class="set-link" data-i="${i}">
        <input class="set-link-name" placeholder="Tên (vd Giới thiệu)" value="${escapeHtml(l.name)}" />
        <input class="set-link-url" placeholder="URL (vd /about.html)" value="${escapeHtml(l.url)}" />
        <button type="button" class="set-mini" data-act="up" title="Lên">▲</button>
        <button type="button" class="set-mini" data-act="down" title="Xuống">▼</button>
        <button type="button" class="set-mini set-del" data-act="del" title="Xóa">✕</button>
      </div>`
    )
    .join('');
}

function renderAll() {
  root.innerHTML = `
    <form class="admin-form" id="settings-form">
      <h2>Favicon</h2>
      ${imgBox('favicon', state.faviconUrl)}

      <h2>Logo</h2>
      ${imgBox('logo', state.logoUrl)}
      <label>Tên website <small>(hiện thay logo nếu chưa có logo)</small>
        <input id="site-name" value="${escapeHtml(state.siteName)}" />
      </label>

      <h2>Footer</h2>
      <label>Nội dung Copyright
        <input id="ft-copyright" value="${escapeHtml(state.footer.copyright)}" />
      </label>
      <label>Giới thiệu ngắn
        <textarea id="ft-intro" rows="2">${escapeHtml(state.footer.intro)}</textarea>
      </label>
      <label>Các liên kết footer</label>
      <div id="links-wrap">${linksRows()}</div>
      <button type="button" class="auth-btn auth-btn-ghost" id="add-link">+ Thêm liên kết</button>

      <div class="admin-actions">
        <button class="auth-btn" type="submit">Lưu cài đặt</button>
        <span class="admin-status" id="st-save"></span>
      </div>
    </form>`;

  bindEvents();
}

// --- Đồng bộ giá trị đang nhập vào state (trước khi re-render / lưu) ---
function syncFromDOM() {
  state.siteName = $('site-name').value;
  state.footer.copyright = $('ft-copyright').value;
  state.footer.intro = $('ft-intro').value;
  state.footer.links = [...document.querySelectorAll('.set-link')].map(row => ({
    name: row.querySelector('.set-link-name').value.trim(),
    url: row.querySelector('.set-link-url').value.trim(),
  }));
}

function bindEvents() {
  // Upload favicon/logo
  ['favicon', 'logo'].forEach(kind => {
    $(`file-${kind}`).addEventListener('change', e => handleUpload(kind, e));
    $(`del-${kind}`).addEventListener('click', () => {
      if (kind === 'favicon') state.faviconUrl = '';
      else state.logoUrl = '';
      $(`prev-${kind}`).innerHTML = '<span class="set-empty">Chưa có</span>';
    });
  });

  // Thêm liên kết
  $('add-link').addEventListener('click', () => {
    syncFromDOM();
    state.footer.links.push({ name: '', url: '' });
    $('links-wrap').innerHTML = linksRows();
  });

  // Sửa/xóa/di chuyển liên kết (event delegation)
  $('links-wrap').addEventListener('click', e => {
    const btn = e.target.closest('.set-mini');
    if (!btn) return;
    syncFromDOM();
    const i = Number(btn.closest('.set-link').dataset.i);
    const act = btn.dataset.act;
    const links = state.footer.links;
    if (act === 'del') links.splice(i, 1);
    else if (act === 'up' && i > 0) [links[i - 1], links[i]] = [links[i], links[i - 1]];
    else if (act === 'down' && i < links.length - 1)
      [links[i + 1], links[i]] = [links[i], links[i + 1]];
    $('links-wrap').innerHTML = linksRows();
  });

  // Lưu
  $('settings-form').addEventListener('submit', handleSave);
}

async function handleUpload(kind, e) {
  const file = e.target.files[0];
  if (!file) return;
  const st = $(`st-${kind}`);
  st.textContent = 'Đang tải lên…';
  st.className = 'admin-status';
  try {
    const { url } = await api.uploadImage(file);
    if (kind === 'favicon') state.faviconUrl = url;
    else state.logoUrl = url;
    $(`prev-${kind}`).innerHTML = `<img src="${escapeHtml(url)}" alt="${kind}" />`;
    st.textContent = '✓ Đã tải lên (nhớ bấm Lưu)';
    st.classList.add('ok');
  } catch (err) {
    st.textContent = '✗ ' + err.message;
    st.classList.add('err');
  }
  e.target.value = '';
}

async function handleSave(e) {
  e.preventDefault();
  syncFromDOM();
  const st = $('st-save');
  st.textContent = 'Đang lưu…';
  st.className = 'admin-status';
  try {
    await api.updateSettings(state);
    st.textContent = '✓ Đã lưu — áp dụng toàn website';
    st.classList.add('ok');
  } catch (err) {
    st.textContent = '✗ ' + err.message;
    st.classList.add('err');
  }
}

// --- Boot ---
async function boot() {
  root.innerHTML = '<p class="lb-empty">Đang kiểm tra quyền…</p>';
  let me;
  try {
    me = (await api.me()).user;
  } catch {
    me = null;
  }
  if (!me || !me.isAdmin) {
    root.innerHTML = `
      <div class="admin-msg">
        <p>Bạn không có quyền quản trị.</p>
        <p><a class="auth-btn auth-btn-ghost" href="index.html">Về trang chủ</a></p>
      </div>`;
    return;
  }
  const { data } = await api.getSettings();
  state = {
    siteName: data.siteName || 'Dino Dash',
    faviconUrl: data.faviconUrl || '',
    logoUrl: data.logoUrl || '',
    footer: {
      copyright: data.footer?.copyright || '',
      intro: data.footer?.intro || '',
      links: Array.isArray(data.footer?.links) ? data.footer.links : [],
    },
  };
  renderAll();
}

boot();
