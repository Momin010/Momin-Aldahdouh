import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // REMOVED: The define block that exposed API_KEY to the client.
  // This is a critical security improvement. API calls are now proxied.
})
