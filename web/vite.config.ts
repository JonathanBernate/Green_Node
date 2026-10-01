import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    // Permite acceder a través de túneles HTTPS (localtunnel, ngrok, etc.)
    // para probar la cámara desde el celular.
    allowedHosts: ['.loca.lt', '.ngrok-free.app', '.trycloudflare.com'],
    // Clasificador en vivo (realtime/, FastAPI). Al pasar por el proxy funciona
    // también a través de túneles HTTPS (wss) desde el celular.
    proxy: {
      '/live': {
        target: 'http://localhost:8765',
        ws: true,
        rewrite: (p) => p.replace(/^\/live/, ''),
      },
    },
  },
});
