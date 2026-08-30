/** @type {import('astro').AstroConfig} */
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

export default defineConfig({
  site: 'https://www.524900.xyz',
  trailingSlash: 'always',
  outDir: './dist',
  output: 'static',
  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['zh-CN', 'en-US'],
  },
  integrations: [vue()],
  vite: {
    build: {
      minify: true,
    },
  },
});
