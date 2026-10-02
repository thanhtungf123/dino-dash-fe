import { API_BASE } from './config.js';

/**
 * Gọi API. Luôn kèm cookie (credentials) để gửi JWT đăng nhập.
 * Ném Error với message tiếng Việt từ backend khi request thất bại.
 */
async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // phản hồi không phải JSON
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Lỗi ${res.status}`);
    err.status = res.status;
    err.data = data || {};
    err.banned = !!data?.banned; // tài khoản bị cấm (gian lận)
    throw err;
  }
  return data;
}

export const api = {
  register: (username, password) =>
    request('/auth/register', { method: 'POST', body: { username, password } }),

  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: { username, password } }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  me: () => request('/auth/me'),

  // Xin session token khi bắt đầu ván (dùng cho anti-cheat).
  startSession: () => request('/scores/session', { method: 'POST' }),

  submitScore: (score, sessionToken) =>
    request('/scores', { method: 'POST', body: { score, sessionToken } }),

  leaderboard: limit =>
    request(`/leaderboard${limit ? `?limit=${limit}` : ''}`),

  // Top 3 tháng trước (đã chốt) — cho khối trên trang chủ.
  leaderboardPrevious: () => request('/leaderboard/previous'),

  // Lịch sử theo tháng của chính mình + trạng thái nhận thưởng.
  myHistory: () => request('/me/history'),

  // Người lọt top tự điền thông tin nhận thưởng cho một tháng.
  submitClaim: data => request('/me/claim', { method: 'POST', body: data }),

  // --- Admin: quản lý top & phần thưởng ---
  adminSeasons: () => request('/admin/seasons'),

  // Admin: danh sách người chơi (tìm kiếm, phân trang, lọc bị cấm).
  adminUsers: ({ q = '', page = 1, bannedOnly = false } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (page > 1) params.set('page', page);
    if (bannedOnly) params.set('banned', 'true');
    const qs = params.toString();
    return request(`/admin/users${qs ? `?${qs}` : ''}`);
  },
  adminCloseSeason: monthKey =>
    request('/admin/seasons/close', { method: 'POST', body: { monthKey } }),
  adminDisqualify: (monthKey, userId) =>
    request(`/admin/seasons/${monthKey}/disqualify`, {
      method: 'POST',
      body: { userId },
    }),
  adminAward: (monthKey, userId) =>
    request(`/admin/seasons/${monthKey}/award`, {
      method: 'POST',
      body: { userId },
    }),
  adminBanUser: (id, reason) =>
    request(`/admin/users/${id}/ban`, { method: 'POST', body: { reason } }),
  adminUnbanUser: id =>
    request(`/admin/users/${id}/unban`, { method: 'POST' }),

  // Nội dung website (Giới thiệu / Phần thưởng).
  getContent: key => request(`/content/${key}`),

  updateContent: (key, data) =>
    request(`/content/${key}`, { method: 'PUT', body: { data } }),

  // Cài đặt website (favicon / logo / tên / footer).
  getSettings: () => request('/settings'),

  updateSettings: data =>
    request('/settings', { method: 'PUT', body: { data } }),

  // Quản lý trang tùy biến (admin).
  pages: () => request('/pages'),
  createPage: data => request('/pages', { method: 'POST', body: data }),
  updatePage: (id, data) => request(`/pages/${id}`, { method: 'PUT', body: data }),
  deletePage: id => request(`/pages/${id}`, { method: 'DELETE' }),

  // Upload ảnh (favicon/logo) — dùng FormData nên gọi fetch trực tiếp.
  uploadImage: async file => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`${API_BASE}/settings/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* không phải JSON */
    }
    if (!res.ok) throw new Error(data?.error || `Lỗi ${res.status}`);
    return data; // { url }
  },
};
