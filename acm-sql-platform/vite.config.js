import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-codemirror': [
            '@uiw/react-codemirror',
            '@codemirror/lang-sql',
            '@codemirror/theme-one-dark',
          ],
          'vendor-sqljs': ['sql.js'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['lucide-react'],
          'vendor-router': ['react-router-dom'],
        },
      },
    },
  },
})
