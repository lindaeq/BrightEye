import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/runs': 'http://127.0.0.1:3001',
      '/qnx': {
        target: process.env.QNX_TRACKER_URL || 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/qnx/, '') || '/',
      },
    },
  },
});
