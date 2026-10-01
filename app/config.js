// Tự chọn địa chỉ API theo môi trường (không cần build tool):
// - Khi mở ở localhost -> gọi backend local (cổng 3001).
// - Khi deploy trên VPS (frontend + API cùng domain) -> dùng đường dẫn tương đối "/api",
//   Nginx sẽ proxy "/api" tới Node backend.
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

export const API_BASE = isLocal ? 'http://localhost:3001/api' : '/api';
