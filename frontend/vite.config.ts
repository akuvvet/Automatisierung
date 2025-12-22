import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,                  // akzeptiert externe Verbindungen
    port: 5175,
    strictPort: true,
    allowedHosts: ['app.klick-und-fertig.de'],
    // HMR über Reverse-Proxy (HTTPS → WSS) erlauben
    hmr: {
      host: 'app.klick-und-fertig.de', // öffentlicher Hostname
      clientPort: 443,                 // Browser nutzt 443 hinter HTTPS/TLS
      protocol: 'wss',                 // sicheres WebSocket-Protokoll
    },
    // Setze den öffentlichen Origin, damit absolute URLs korrekt sind
    origin: 'https://app.klick-und-fertig.de',
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
      '/oguz/telematik': { target: 'http://localhost:5007', changeOrigin: true, rewrite: p => p.replace(/^\/oguz\/telematik/, '/telematik') },
      '/oguz/results':   { target: 'http://localhost:5007', changeOrigin: true, rewrite: p => p.replace(/^\/oguz\/results/, '/results') },
      '/oguz/health':    { target: 'http://localhost:5007', changeOrigin: true, rewrite: p => p.replace(/^\/oguz\/health/, '/health') },
    },
  },
})