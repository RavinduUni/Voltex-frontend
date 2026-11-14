import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The Spring Boot backend has no CORS configuration, so the browser can't call it
// directly from another origin. In development, Vite proxies every /api request to
// the backend, which makes the calls same-origin. See README for production setups.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_BACKEND_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          // Keep big libraries in their own files so app updates don't re-download them.
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            gsap: ['gsap', '@gsap/react'],
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          configure: (proxy) => {
            // Drop the browser Origin header so the backend treats it as a plain request.
            proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'));
          },
        },
      },
    },
  };
});
