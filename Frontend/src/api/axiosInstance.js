import axios from 'axios';

/**
 * Axios instance dùng chung cho toàn bộ app.
 * Base URL trỏ về /api — Vite proxy sẽ chuyển sang http://localhost:5000/api
 */
const axiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor:
 * Tự động đính kèm JWT Token vào header Authorization trước khi gửi mọi request.
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('techshop_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor:
 * Nếu server trả về 401 (Unauthorized) hoặc 403 (Forbidden) → tự động logout
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('techshop_token');
      localStorage.removeItem('techshop_user');
      // Redirect về login nếu chưa ở trang login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
