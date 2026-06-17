import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tailwind v4 is wired up via PostCSS (see postcss.config.js).
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
