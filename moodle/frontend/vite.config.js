import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/auth':        'http://localhost:5001',
      '/courses':     'http://localhost:5001',
      '/assignments': 'http://localhost:5001',
      '/uploads':     'http://localhost:5001',
    }
  }
})
