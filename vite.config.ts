import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server proxies the API to the Symfony backend so the SPA talks to a
// same-origin `/api` (no CORS in dev, refresh-token cookie flows naturally).
// In production the SPA is served behind a reverse proxy that routes /api -> backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
