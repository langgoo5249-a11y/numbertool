/** @type {import('astro').AstroConfig} */
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': join(__dirname, 'src'),
        '@layouts': join(__dirname, 'src/layouts'),
        '@components': join(__dirname, 'src/components'),
        '@lib': join(__dirname, 'src/lib'),
      },
    },
    build: {
      minify: true,
    },
  },
});
