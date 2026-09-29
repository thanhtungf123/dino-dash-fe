import { api } from './api.js';

const el = document.getElementById('admin');

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

async function save(key, data, statusId) {
  const st = document.getElementById(statusId);
  st.textContent = 'Đang lưu…';
  st.className = 'admin-status';
  try {
    await api.updateContent(key, data);
    st.textContent = '✓ Đã lưu';
    st.classList.add('ok');
  } catch (err) {
    st.textContent = '✗ ' + err.message;
    st.classList.add('err');
  }
}

function renderForms(me, about, rewards) {
  const prizes = [...(rewards.prizes || [])];
  while (prizes.length < 3) prizes.push({});

  el.innerHTML = `
    <p class="admin-hello">
      Xin chào admin <strong>${escapeHtml(me.username)}</strong>. Sửa nội dung
      bên dưới rồi bấm <em>Lưu</em> — thay đổi hiển thị ngay cho người chơi.
    </p>

    <form class="admin-form" id="form-about">
      <h2>Giới thiệu</h2>
      <label>Tiêu đề
        <input id="ab-title" value="${escapeHtml(about.title || '')}" />
      </label>
      <label>Nội dung <small>(cách 1 dòng trống = đoạn mới)</small>
        <textarea id="ab-body" rows="8">${escapeHtml(about.body || '')}</textarea>
      </label>
      <div class="admin-actions">
        <button class="auth-btn" type="submit">Lưu Giới thiệu</button>
        <span class="admin-status" id="st-about"></span>
      </div>
    </form>

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
            <input id="rw-place-${i}" placeholder="Hạng (vd 🥇 Top 1)"
              value="${escapeHtml(p.place || '')}" />
            <input id="rw-amount-${i}" placeholder="Phần thưởng (vd 300.000đ)"
              value="${escapeHtml(p.amount || '')}" />
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

  document.getElementById('form-about').addEventListener('submit', async e => {
    e.preventDefault();
    await save('about', { title: val('ab-title'), body: val('ab-body') }, 'st-about');
  });

  document
    .getElementById('form-rewards')
    .addEventListener('submit', async e => {
      e.preventDefault();
      const prizesData = [0, 1, 2]
        .map(i => ({ place: val(`rw-place-${i}`), amount: val(`rw-amount-${i}`) }))
        .filter(p => p.place || p.amount);
      await save(
        'rewards',
        {
          title: val('rw-title'),
          intro: val('rw-intro'),
          prizes: prizesData,
          rules: val('rw-rules'),
          contact: val('rw-contact'),
        },
        'st-rewards'
      );
    });
}

async function boot() {
  el.innerHTML = '<p class="lb-empty">Đang kiểm tra quyền…</p>';

  let me;
  try {
    me = (await api.me()).user;
  } catch {
    me = null;
  }

  if (!me) {
    el.innerHTML = `
      <div class="admin-msg">
        <p>Bạn chưa đăng nhập.</p>
        <p><a class="auth-btn" href="index.html">Đăng nhập ở trang chơi →</a></p>
      </div>`;
    return;
  }
  if (!me.isAdmin) {
    el.innerHTML = `
      <div class="admin-msg">
        <p>Bạn không có quyền quản trị.</p>
        <p><a class="auth-btn auth-btn-ghost" href="index.html">Về trang chủ</a></p>
      </div>`;
    return;
  }

  const about = (await api.getContent('about')).data || {};
  const rewards = (await api.getContent('rewards')).data || {};
  renderForms(me, about, rewards);
}

boot();
