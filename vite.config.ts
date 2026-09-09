import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  server: {
    host: '127.0.0.1',
    strictPort: true,
    watch: { useFsEvents: false, usePolling: true },
  },
  plugins: [vinext()],
});
