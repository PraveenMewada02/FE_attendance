import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/mcid': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/inout': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/files': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/mcid-data': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/monitor': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/cron': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
