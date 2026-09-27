import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { port: 4200 },
  test: {
    include: ['src/test/**/*.test.{js,jsx}'],
    environment: 'jsdom',
    testTimeout: 20000,
    setupFiles: './src/test/setup.js',
    globals: true,
    css: false,
  },
});
