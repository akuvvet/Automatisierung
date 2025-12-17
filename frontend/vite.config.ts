import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,                  // akzeptiert externe Verbindungen
    port: 5175,
    strictPort: true,
    allowedHosts: ['app.klick-und-fertig.de'],
    hmr: false,
    proxy: {
      '/auth': { target: 'http://localhost:3007', changeOrigin: true },
      '/logs': { target: 'http://localhost:3007', changeOrigin: true },
      '/py':   { target: 'http://localhost:5005', changeOrigin: true, rewrite: p => p.replace(/^\/py/, '') },
      '/klees':{ target: 'http://localhost:5006', changeOrigin: true, rewrite: p => p.replace(/^\/klees/, '') },
    },
  },
})