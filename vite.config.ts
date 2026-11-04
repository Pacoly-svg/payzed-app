import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import pkg from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  // « / » pour Android et iPhone (Capacitor) ; « /payzed-app/ » pour la web app publiée sur GitHub Pages
  base: process.env.PAYZED_BASE || '/',
  plugins: [tailwindcss(), react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2020', // compatible avec les WebView Android plus anciennes
    sourcemap: false,
  },
})
