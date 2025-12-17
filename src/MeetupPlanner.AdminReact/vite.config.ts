import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['host.docker.internal'],
    host: true,
    port: parseInt(process.env.PORT ?? '5173'),
    proxy: {
      '/api': {
        target: process.env.API_HTTPS || process.env.API_HTTP,
        changeOrigin: true,
        //secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
