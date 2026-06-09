// @ts-check
import { defineConfig } from 'astro/config';
import wix from '@wix/astro';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [wix(), react()],
  security: { checkOrigin: false },
  devToolbar: { enabled: false },
  vite: {
    server: {
      cors: {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
    },
  },
});
