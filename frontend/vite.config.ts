import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => {
  const domainHmrHost = process.env.VITE_HMR_HOST
  const domainHmrClientPort = Number(process.env.VITE_HMR_CLIENT_PORT || '443')
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5175,
      strictPort: true,
      allowedHosts: ['app.klick-und-fertig.de', 'localhost'],
      hmr: domainHmrHost
        ? {
            protocol: 'wss',
            host: domainHmrHost,
            clientPort: domainHmrClientPort,
          }
        : {
            protocol: 'ws',
            host: 'localhost',
            port: 5175,
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
  }
})
