import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
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

