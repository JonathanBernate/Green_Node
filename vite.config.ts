import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
  },
  define: {
    __DEV__: JSON.stringify(true),
    process: { env: {}, version: '"0.86.0"', nextTick: 'fn' },
  },
  optimizeDeps: {
    include: ['react-native-web', 'react', 'react-dom'],
  },
});
