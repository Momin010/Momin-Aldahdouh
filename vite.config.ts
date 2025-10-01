import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This makes the VITE_API_KEY from your .env or Vercel config
    // available as process.env.API_KEY in your client-side code.
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY)
  }
})
