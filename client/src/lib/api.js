import axios from 'axios';

// VITE_API_URL must be:
//   https://your-backend.onrender.com/api   ← NO trailing slash
// That way api.get('/share/my') → https://your-backend.onrender.com/api/share/my ✓
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Uncomment temporarily to debug URL issues:
  // console.log('[API]', config.method?.toUpperCase(), config.baseURL + config.url);

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;