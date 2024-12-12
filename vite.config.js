import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/icon': {
        target: 'http://192.168.224.127:82',
        changeOrigin: true
      }
    }
  }
})
