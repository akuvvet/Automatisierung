import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,                  // akzeptiert externe Verbindungen
    port: 5175,
    strictPort: true,
    // Lokale Entwicklung: Standard-HMR via ws auf localhost
    // Remote-Setup (z. B. hinter HTTPS-Proxy) kann per ENV aktiviert werden:
    //   VITE_REMOTE_HOST=app.klick-und-fertig.de VITE_HMR_WSS=1
    allowedHosts: process.env.VITE_REMOTE_HOST ? [process.env.VITE_REMOTE_HOST] : undefined,
    hmr: process.env.VITE_REMOTE_HOST
      ? {
          host: process.env.VITE_REMOTE_HOST,
          clientPort: 443,
          protocol: process.env.VITE_HMR_WSS === '1' ? 'wss' : 'ws',
        }
      : {
          host: 'localhost',
          port: 5175,
          protocol: 'ws',
        },
    origin: process.env.VITE_REMOTE_HOST ? `https://${process.env.VITE_REMOTE_HOST}` : undefined,
    // Stabilere File-Watcher-Einstellungen für Remote/VM/FS
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    },
    proxy: {
      '/auth': { target: 'http://localhost:3007', changeOrigin: true },
      '/logs': { target: 'http://localhost:3007', changeOrigin: true },
      '/py':   { target: 'http://localhost:5005', changeOrigin: true, rewrite: p => p.replace(/^\/py/, '') },
      '/klees/upload': { target: 'http://localhost:5006', changeOrigin: true, rewrite: p => p.replace(/^\/klees\/upload/, '/upload') },
      '/klees/health': { target: 'http://localhost:5006', changeOrigin: true, rewrite: p => p.replace(/^\/klees\/health/, '/health') },
      // Neuer Gateway-Weg: Frontend → Node-Backend → Python-Service
      '/oguz': { target: 'http://localhost:3007', changeOrigin: true },
    },
  },
})