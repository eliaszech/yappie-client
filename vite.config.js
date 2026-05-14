import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
      tailwindcss(),
  ],
    server: {
      allowedHosts: [
          'e682-2a04-ee41-7-e023-1c1b-bfe4-be26-c10f.ngrok-free.app'
      ],
        proxy: {
            '/api': 'http://localhost:8000',
            '/broadcasting': 'http://localhost:8000',
        }
    }
})
