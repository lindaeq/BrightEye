import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const trackerUrl = process.env.QNX_TRACKER_URL?.trim();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __QNX_TRACKER_ENABLED__: JSON.stringify(Boolean(trackerUrl)),
  },
  server: {
    proxy: {
      '/api/runs': 'http://127.0.0.1:3001',
      ...(trackerUrl ? { '/qnx': {
        target: trackerUrl,
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/qnx/, '') || '/',
      } } : {}),
    },
  },
});
