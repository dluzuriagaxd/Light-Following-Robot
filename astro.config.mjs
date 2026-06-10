import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  env: {
    schema: {
      PUBLIC_SUPABASE_URL: envField.string({ context: 'client', access: 'public', default: 'https://nbhvyqdcijfgtzdfqzyd.supabase.co' }),
      PUBLIC_SUPABASE_ANON_KEY: envField.string({ context: 'client', access: 'public', default: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iaHZ5cWRjaWpmZ3R6ZGZxenlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDIxNzgsImV4cCI6MjA5NjYxODE3OH0.96n27brL8OG5nA2SgOHbYPwU0PEd1WnKfhe9hfxVorc' }),
      PUBLIC_MAINTENANCE_MODE: envField.boolean({ context: 'client', access: 'public', default: false }),
    }
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    runtime: {
      mode: 'local',
      type: 'pages',
      bindings: {},
    },
    wasmModuleImports: true,
  }),
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['node:async_hooks']
    }
  },

  integrations: [react(), mdx()],

  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  }
});

