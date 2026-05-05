import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth':       { target: 'http://localhost:8080', changeOrigin: true },
      '/food':       { target: 'http://localhost:8080', changeOrigin: true },
      '/cart':       { target: 'http://localhost:8080', changeOrigin: true },
      '/order':      { target: 'http://localhost:8080', changeOrigin: true },
      '/restaurant': { target: 'http://localhost:8080', changeOrigin: true },
      '/admin':      { target: 'http://localhost:8080', changeOrigin: true },
      '/payment':    { target: 'http://localhost:8080', changeOrigin: true },
    }
  }
})
