import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Note: Proxy is not used since we're using axios with baseURL from VITE_API_DEPLOY_URL
    // API calls are made directly to the backend URL specified in VITE_API_DEPLOY_URL
  },
})
