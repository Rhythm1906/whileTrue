import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({ babel: true })],
  base: process.env.NODE_ENV === 'production' ? '/whileTrue/' : '/judges-court/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
  server: {
    host: true,
  },
})