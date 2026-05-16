import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: './',
  plugins: [
      react(),
      tailwindcss(),
  ],
    server: {
      allowedHosts: 'all',
    },
    build: {
        rollupOptions: {
            output: {
                // Keep react/react-dom/scheduler in the catch-all vendor chunk —
                // splitting them out breaks React 19's CJS init order in production.
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;
                    if (id.includes('livekit-client') || id.includes('@livekit')) return 'vendor-livekit';
                    if (/node_modules[\\/](slate|slate-react|slate-history)[\\/]/.test(id)) return 'vendor-slate';
                    if (id.includes('framer-motion')) return 'vendor-framer';
                    if (id.includes('@ferrucc-io/emoji-picker') || id.includes('emoji-mart')) return 'vendor-emoji';
                    if (id.includes('@fortawesome') || id.includes('@awesome.me')) return 'vendor-icons';
                    if (id.includes('web-noise-suppressor')) return 'vendor-rnnoise';
                },
            },
        },
    },
})