import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-quill')) {
            return 'editor'
          }

          if (id.includes('node_modules/hls.js') || id.includes('node_modules/dashjs') || id.includes('node_modules/react-youtube')) {
            return 'player'
          }

          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor'
          }

          return undefined
        }
      }
    }
  },
})
