import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth':        'http://localhost:5000',
      '/dashboard':   'http://localhost:5000',
      '/assignments': 'http://localhost:5000',
      '/events':      'http://localhost:5000',
      '/whatsapp':    'http://localhost:5000',
    }
  }
})
