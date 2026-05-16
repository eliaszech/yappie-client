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
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;
                    if (id.includes('livekit-client') || id.includes('@livekit')) return 'vendor-livekit';
                    if (id.includes('/slate') || id.includes('slate-react') || id.includes('slate-history')) return 'vendor-slate';
                    if (id.includes('framer-motion')) return 'vendor-framer';
                    if (id.includes('emoji-picker') || id.includes('emoji-mart')) return 'vendor-emoji';
                    if (id.includes('@fortawesome') || id.includes('@awesome.me')) return 'vendor-icons';
                    if (id.includes('@tanstack')) return 'vendor-query';
                    if (id.includes('socket.io') || id.includes('engine.io')) return 'vendor-socket';
                    if (id.includes('i18next') || id.includes('react-i18next')) return 'vendor-i18n';
                    if (id.includes('react-router')) return 'vendor-router';
                    if (id.includes('web-noise-suppressor')) return 'vendor-rnnoise';
                    if (id.includes('react-dom') || id.includes('react/') || id.includes('scheduler')) return 'vendor-react';
                    return 'vendor';
                },
            },
        },
    },
})