import { defineConfig } from 'vite';

// Variante pour exposer le dev server via un quick tunnel cloudflared
// (NON committée — usage review uniquement).
export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: { outDir: 'dist' },
  server: {
    host: '127.0.0.1',
    port: 5180,
    strictPort: true,
    allowedHosts: ['.trycloudflare.com'],
    hmr: { protocol: 'wss', clientPort: 443 },
  },
});
