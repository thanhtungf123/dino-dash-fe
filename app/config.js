// Tự chọn địa chỉ API theo môi trường (không cần build tool):
// - Khi mở ở localhost -> gọi backend local.
// - Khi deploy (domain thật) -> gọi backend production trên Railway.
//
// >>> SAU KHI DEPLOY BACKEND, đổi URL production bên dưới cho khớp domain Railway.
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

export const API_BASE = isLocal
  ? 'http://localhost:3001/api'
  : 'https://YOUR-BACKEND.up.railway.app/api';
