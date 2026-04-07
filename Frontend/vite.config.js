import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'http://localhost:5173')
          })
        }
      },
      '/food': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/cart': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/order': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/restaurant': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    }
  }
})
