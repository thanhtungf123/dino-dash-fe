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
};
