import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5174,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5174,
    },
    proxy: {
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/logs': {
        target: 'http://localhost:3000',
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
