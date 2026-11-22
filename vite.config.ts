import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'QNX_TRACKER_URL');
  const trackerUrl = env.QNX_TRACKER_URL?.trim();

  return {
    plugins: [react()],
    define: {
      __QNX_TRACKER_ENABLED__: JSON.stringify(Boolean(trackerUrl)),
    },
    server: {
      proxy: {
        '/api/report-chat': 'http://127.0.0.1:3001',
        '/api/runs': 'http://127.0.0.1:3001',
        ...(trackerUrl ? { '/qnx': {
          target: trackerUrl,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/qnx/, '') || '/',
        } } : {}),
      },
    },
  };
});
