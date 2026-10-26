import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_DEV_API_TARGET || 'http://127.0.0.1:5000';

  return {
    plugins: [react()],
    build: {
      // Giữ nguyên :is() trong CSS (nếu hạ cấp, các selector theme sẽ bị khai triển thành hàng MB)
      cssTarget: 'chrome111'
    },
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false
        },
        '/uploads': {
          target,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
