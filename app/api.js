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
    throw new Error(data?.error || `Lỗi ${res.status}`);
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

  // Nội dung website (Giới thiệu / Phần thưởng).
  getContent: key => request(`/content/${key}`),

  updateContent: (key, data) =>
    request(`/content/${key}`, { method: 'PUT', body: { data } }),

  // Cài đặt website (favicon / logo / tên / footer).
  getSettings: () => request('/settings'),

  updateSettings: data =>
    request('/settings', { method: 'PUT', body: { data } }),

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
