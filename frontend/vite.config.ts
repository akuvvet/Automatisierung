import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,                  // akzeptiert externe Verbindungen
    port: 5175,
    strictPort: true,
    // Remote/Proxy-Setup: Domain für HMR definieren (verhindert ws://localhost)
    // Setz ggf. VITE_REMOTE_HOST oder KUF_REMOTE_HOST in der Umgebung.
    // Fallback: app.klick-und-fertig.de
    get allowedHosts() {
      const remoteHost = process.env.VITE_REMOTE_HOST || process.env.KUF_REMOTE_HOST || 'app.klick-und-fertig.de'
      return [remoteHost, '.klick-und-fertig.de']
    },
    // Lokale Entwicklung: Standard-HMR via ws auf localhost
    // Remote-Setup (z. B. hinter HTTPS-Proxy) kann per ENV aktiviert werden:
    //   VITE_REMOTE_HOST=app.klick-und-fertig.de VITE_HMR_WSS=1
    // HMR:
    // - Wenn REMOTE_HOST gesetzt ist, explizit konfigurieren (Proxy/HTTPS).
    // - Sonst Standard-Autodetect von Vite nutzen (keine explizite localhost-Vorgabe),
    //   um Reload-Schleifen durch unerreichbare ws://localhost zu vermeiden.
    hmr: (() => {
      const remoteHost = process.env.VITE_REMOTE_HOST || process.env.KUF_REMOTE_HOST || 'app.klick-und-fertig.de'
      const forceRemote = true // immer Remote-Host verwenden, um ws://localhost zu vermeiden
      if (forceRemote) {
        return {
          host: remoteHost,
          clientPort: 443,
          protocol: 'wss',
        }
      }
      return undefined
    })(),
    origin: (() => {
      const remoteHost = process.env.VITE_REMOTE_HOST || process.env.KUF_REMOTE_HOST || 'app.klick-und-fertig.de'
      return `https://${remoteHost}`
    })(),
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