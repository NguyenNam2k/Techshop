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
 * Nếu server trả về 401 (Unauthorized) trên các request cần xác thực → tự động logout.
 * Không redirect nếu đang trong luồng auth (login/register) để UI hiển thị thông báo lỗi.
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    if ((status === 401 || status === 403) && !isAuthRequest) {
      localStorage.removeItem('techshop_token');
      localStorage.removeItem('techshop_user');
      localStorage.removeItem('techgear_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
