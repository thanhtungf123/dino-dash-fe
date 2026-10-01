import { api } from './api.js';

const root = document.getElementById('admin');

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

const val = id => document.getElementById(id).value;
let content = null; // vùng nội dung bên phải

async function runSave(statusId, fn) {
  const st = document.getElementById(statusId);
  st.textContent = 'Đang lưu…';
  st.className = 'admin-status';
  try {
    await fn();
    st.textContent = '✓ Đã lưu';
    st.classList.add('ok');
  } catch (err) {
    st.textContent = '✗ ' + err.message;
    st.classList.add('err');
  }
}

// ==================== GIỚI THIỆU ====================
async function renderAbout() {
  content.innerHTML = '<p class="lb-empty">Đang tải…</p>';
  const about = (await api.getContent('about')).data || {};
  content.innerHTML = `
    <form class="admin-form" id="form-about">
      <h2>Giới thiệu</h2>
      <label>Tiêu đề
        <input id="ab-title" value="${escapeHtml(about.title || '')}" />
      </label>
      <label>Nội dung <small>(cách 1 dòng trống = đoạn mới)</small>
        <textarea id="ab-body" rows="10">${escapeHtml(about.body || '')}</textarea>
      </label>
      <div class="admin-actions">
        <button class="auth-btn" type="submit">Lưu Giới thiệu</button>
        <span class="admin-status" id="st-about"></span>
      </div>
    </form>`;
  document.getElementById('form-about').addEventListener('submit', e => {
    e.preventDefault();
    runSave('st-about', () =>
      api.updateContent('about', { title: val('ab-title'), body: val('ab-body') })
    );
  });
}

// ==================== NỘI DUNG TRANG CHỦ ====================
async function renderHomeContent() {
  content.innerHTML = '<p class="lb-empty">Đang tải…</p>';
  const home = (await api.getContent('home')).data || {};
  content.innerHTML = `
    <form class="admin-form" id="form-home">
      <h2>Nội dung trang chủ</h2>
      <label>Tiêu đề
        <input id="hm-title" value="${escapeHtml(home.title || '')}" />
      </label>
      <label>Nội dung <small>(cách 1 dòng trống = đoạn mới)</small>
        <textarea id="hm-body" rows="8">${escapeHtml(home.body || '')}</textarea>
      </label>
      <div class="admin-actions">
        <button class="auth-btn" type="submit">Lưu nội dung trang chủ</button>
        <span class="admin-status" id="st-home"></span>
      </div>
    </form>`;
  document.getElementById('form-home').addEventListener('submit', e => {
    e.preventDefault();
    runSave('st-home', () =>
      api.updateContent('home', { title: val('hm-title'), body: val('hm-body') })
    );
  });
}

// ==================== PHẦN THƯỞNG ====================
async function renderRewards() {
  content.innerHTML = '<p class="lb-empty">Đang tải…</p>';
  const rewards = (await api.getContent('rewards')).data || {};
  const prizes = [...(rewards.prizes || [])];
  while (prizes.length < 3) prizes.push({});

  content.innerHTML = `
    <form class="admin-form" id="form-rewards">
      <h2>Phần thưởng</h2>
      <label>Tiêu đề
        <input id="rw-title" value="${escapeHtml(rewards.title || '')}" />
      </label>
      <label>Giới thiệu
        <textarea id="rw-intro" rows="3">${escapeHtml(rewards.intro || '')}</textarea>
      </label>
      <div class="admin-prizes">
        ${prizes
          .slice(0, 3)
          .map(
            (p, i) => `
          <div class="admin-prize">
            <input id="rw-place-${i}" placeholder="Hạng (vd 🥇 Top 1)" value="${escapeHtml(p.place || '')}" />
            <input id="rw-amount-${i}" placeholder="Phần thưởng (vd 300.000đ)" value="${escapeHtml(p.amount || '')}" />
          </div>`
          )
          .join('')}
      </div>
      <label>Thể lệ <small>(mỗi dòng = 1 mục)</small>
        <textarea id="rw-rules" rows="6">${escapeHtml(rewards.rules || '')}</textarea>
      </label>
      <label>Liên hệ nhận thưởng
        <input id="rw-contact" value="${escapeHtml(rewards.contact || '')}" />
      </label>
      <div class="admin-actions">
        <button class="auth-btn" type="submit">Lưu Phần thưởng</button>
        <span class="admin-status" id="st-rewards"></span>
      </div>
    </form>`;
  document.getElementById('form-rewards').addEventListener('submit', e => {
    e.preventDefault();
    const prizesData = [0, 1, 2]
      .map(i => ({ place: val(`rw-place-${i}`), amount: val(`rw-amount-${i}`) }))
      .filter(p => p.place || p.amount);
    runSave('st-rewards', () =>
      api.updateContent('rewards', {
        title: val('rw-title'),
        intro: val('rw-intro'),
        prizes: prizesData,
        rules: val('rw-rules'),
        contact: val('rw-contact'),
      })
    );
  });
}

// ==================== CÀI ĐẶT WEBSITE ====================
let settings = null;

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
  return settings.footer.links
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

function syncSettingsFromDOM() {
  settings.siteName = val('site-name');
  settings.footer.copyright = val('ft-copyright');
  settings.footer.intro = val('ft-intro');
  settings.footer.links = [...document.querySelectorAll('.set-link')].map(row => ({
    name: row.querySelector('.set-link-name').value.trim(),
    url: row.querySelector('.set-link-url').value.trim(),
  }));
}

async function renderSettings() {
  content.innerHTML = '<p class="lb-empty">Đang tải…</p>';
  const { data } = await api.getSettings();
  settings = {
    siteName: data.siteName || 'Dino Dash',
    faviconUrl: data.faviconUrl || '',
    logoUrl: data.logoUrl || '',
    footer: {
      copyright: data.footer?.copyright || '',
      intro: data.footer?.intro || '',
      links: Array.isArray(data.footer?.links) ? data.footer.links : [],
    },
  };

  content.innerHTML = `
    <form class="admin-form" id="settings-form">
      <h2>Favicon</h2>
      ${imgBox('favicon', settings.faviconUrl)}
      <h2>Logo</h2>
      ${imgBox('logo', settings.logoUrl)}
      <label>Tên website <small>(hiển thị cạnh logo)</small>
        <input id="site-name" value="${escapeHtml(settings.siteName)}" />
      </label>
      <h2>Footer</h2>
      <label>Nội dung Copyright
        <input id="ft-copyright" value="${escapeHtml(settings.footer.copyright)}" />
      </label>
      <label>Giới thiệu ngắn
        <textarea id="ft-intro" rows="2">${escapeHtml(settings.footer.intro)}</textarea>
      </label>
      <label>Các liên kết footer</label>
      <div id="links-wrap">${linksRows()}</div>
      <button type="button" class="auth-btn auth-btn-ghost" id="add-link">+ Thêm liên kết</button>
      <div class="admin-actions">
        <button class="auth-btn" type="submit">Lưu cài đặt</button>
        <span class="admin-status" id="st-save"></span>
      </div>
    </form>`;

  ['favicon', 'logo'].forEach(kind => {
    document
      .getElementById(`file-${kind}`)
      .addEventListener('change', e => handleUpload(kind, e));
    document.getElementById(`del-${kind}`).addEventListener('click', () => {
      if (kind === 'favicon') settings.faviconUrl = '';
      else settings.logoUrl = '';
      document.getElementById(`prev-${kind}`).innerHTML =
        '<span class="set-empty">Chưa có</span>';
    });
  });

  document.getElementById('add-link').addEventListener('click', () => {
    syncSettingsFromDOM();
    settings.footer.links.push({ name: '', url: '' });
    document.getElementById('links-wrap').innerHTML = linksRows();
  });

  document.getElementById('links-wrap').addEventListener('click', e => {
    const btn = e.target.closest('.set-mini');
    if (!btn) return;
    syncSettingsFromDOM();
    const i = Number(btn.closest('.set-link').dataset.i);
    const links = settings.footer.links;
    const act = btn.dataset.act;
    if (act === 'del') links.splice(i, 1);
    else if (act === 'up' && i > 0) [links[i - 1], links[i]] = [links[i], links[i - 1]];
    else if (act === 'down' && i < links.length - 1)
      [links[i + 1], links[i]] = [links[i], links[i + 1]];
    document.getElementById('links-wrap').innerHTML = linksRows();
  });

  document.getElementById('settings-form').addEventListener('submit', e => {
    e.preventDefault();
    syncSettingsFromDOM();
    runSave('st-save', () => api.updateSettings(settings));
  });
}

async function handleUpload(kind, e) {
  const file = e.target.files[0];
  if (!file) return;
  const st = document.getElementById(`st-${kind}`);
  st.textContent = 'Đang tải lên…';
  st.className = 'admin-status';
  try {
    const { url } = await api.uploadImage(file);
    if (kind === 'favicon') settings.faviconUrl = url;
    else settings.logoUrl = url;
    document.getElementById(`prev-${kind}`).innerHTML = `<img src="${escapeHtml(
      url
    )}" alt="${kind}" />`;
    st.textContent = '✓ Đã tải lên (nhớ bấm Lưu)';
    st.classList.add('ok');
  } catch (err) {
    st.textContent = '✗ ' + err.message;
    st.classList.add('err');
  }
  e.target.value = '';
}

// ==================== QUẢN LÝ TRANG ====================
async function renderPages() {
  content.innerHTML = '<p class="lb-empty">Đang tải…</p>';
  let pages;
  try {
    ({ pages } = await api.pages());
  } catch (err) {
    content.innerHTML = `<p class="lb-empty">Lỗi: ${escapeHtml(err.message)}</p>`;
    return;
  }
  showPagesList(pages);
}

function showPagesList(pages) {
  const rows = pages.length
    ? pages
        .map(
          p => `
      <div class="page-row" data-id="${p.id}">
        <div class="page-row-info">
          <strong>${escapeHtml(p.title)}</strong>
          <a class="page-slug" href="/${escapeHtml(p.slug)}" target="_blank">/${escapeHtml(p.slug)}</a>
          ${p.noindex ? '<span class="page-tag">noindex</span>' : ''}
        </div>
        <div class="page-row-actions">
          <button type="button" class="auth-btn auth-btn-ghost" data-act="edit">Sửa</button>
          <button type="button" class="auth-btn auth-btn-ghost page-del" data-act="del">Xóa</button>
        </div>
      </div>`
        )
        .join('')
    : '<p class="lb-empty">Chưa có trang nào.</p>';

  content.innerHTML = `
    <div class="admin-form">
      <h2>Quản lý trang</h2>
      <p class="admin-hello">
        Tạo các trang như Liên hệ, Chính sách bảo mật... Mỗi trang có URL riêng
        (vd <code>/lien-he</code>) và cài đặt SEO riêng.
      </p>
      <div id="pages-list">${rows}</div>
      <button type="button" class="auth-btn" id="page-new">+ Tạo trang mới</button>
    </div>`;

  document
    .getElementById('page-new')
    .addEventListener('click', () => showPageForm(null));
  content.querySelectorAll('.page-row').forEach(row => {
    const id = row.dataset.id;
    row.querySelector('[data-act="edit"]').addEventListener('click', () => {
      showPageForm(pages.find(x => x.id === id));
    });
    row.querySelector('[data-act="del"]').addEventListener('click', async () => {
      if (!confirm('Xóa trang này?')) return;
      try {
        await api.deletePage(id);
        renderPages();
      } catch (err) {
        alert('Lỗi: ' + err.message);
      }
    });
  });
}

function showPageForm(page) {
  const isNew = !page;
  content.innerHTML = `
    <form class="admin-form" id="form-page">
      <h2>${isNew ? 'Tạo trang mới' : 'Sửa trang'}</h2>
      <label>Đường dẫn (slug) <small>(vd: lien-he → URL /lien-he)</small>
        <input id="pg-slug" value="${escapeHtml(page?.slug || '')}"
          ${isNew ? 'placeholder="lien-he"' : 'readonly'} />
      </label>
      <label>Tiêu đề
        <input id="pg-title" value="${escapeHtml(page?.title || '')}" />
      </label>
      <label>Mô tả SEO <small>(meta description)</small>
        <textarea id="pg-desc" rows="2">${escapeHtml(page?.metaDescription || '')}</textarea>
      </label>
      <label>Nội dung <small>(cách 1 dòng trống = đoạn mới)</small>
        <textarea id="pg-body" rows="10">${escapeHtml(page?.body || '')}</textarea>
      </label>
      <label class="auth-show">
        <input type="checkbox" id="pg-noindex" ${page?.noindex ? 'checked' : ''} />
        Ẩn khỏi Google (noindex)
      </label>
      <div class="admin-actions">
        <button class="auth-btn" type="submit">Lưu trang</button>
        <button type="button" class="auth-btn auth-btn-ghost" id="pg-cancel">Hủy</button>
        <span class="admin-status" id="st-page"></span>
      </div>
    </form>`;

  document.getElementById('pg-cancel').addEventListener('click', renderPages);
  document.getElementById('form-page').addEventListener('submit', async e => {
    e.preventDefault();
    const data = {
      slug: val('pg-slug'),
      title: val('pg-title'),
      metaDescription: val('pg-desc'),
      body: val('pg-body'),
      noindex: document.getElementById('pg-noindex').checked,
    };
    const st = document.getElementById('st-page');
    st.textContent = 'Đang lưu…';
    st.className = 'admin-status';
    try {
      if (isNew) await api.createPage(data);
      else await api.updatePage(page.id, data);
      renderPages();
    } catch (err) {
      st.textContent = '✗ ' + err.message;
      st.classList.add('err');
    }
  });
}

// ==================== KHUNG + SIDEBAR ====================
const SECTIONS = [
  { key: 'home', label: 'Nội dung trang chủ', render: renderHomeContent },
  { key: 'about', label: 'Giới thiệu', render: renderAbout },
  { key: 'rewards', label: 'Phần thưởng', render: renderRewards },
  { key: 'pages', label: 'Quản lý trang', render: renderPages },
  { key: 'settings', label: 'Cài đặt website', render: renderSettings },
];

function selectSection(key) {
  root.querySelectorAll('.admin-navbtn').forEach(b =>
    b.classList.toggle('active', b.dataset.key === key)
  );
  const sec = SECTIONS.find(s => s.key === key);
  if (sec) sec.render();
}

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

  root.innerHTML = `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        ${SECTIONS.map(
          s => `<button class="admin-navbtn" data-key="${s.key}">${s.label}</button>`
        ).join('')}
      </aside>
      <div class="admin-content" id="admin-content"></div>
    </div>`;

  content = document.getElementById('admin-content');
  root.querySelectorAll('.admin-navbtn').forEach(btn =>
    btn.addEventListener('click', () => selectSection(btn.dataset.key))
  );
  selectSection('home');
}

boot();
