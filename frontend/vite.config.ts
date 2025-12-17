import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,
    allowedHosts: ['app.klick-und-fertig.de'],
    hmr: {
      protocol: 'wss',
      host: 'app.klick-und-fertig.de',
      clientPort: 443,
    },
    proxy: {
      '/auth': {
        target: 'http://localhost:3007',
        changeOrigin: true,
      },
      '/logs': {
        target: 'http://localhost:3007',
        changeOrigin: true,
      },
      '/py': {
        target: 'http://localhost:5005',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/py/, ''),
      },
      '/klees': {
        target: 'http://localhost:5006',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/klees/, ''),
      },
    },
  },
})
