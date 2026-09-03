/** @type {import('astro').AstroConfig} */
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  site: 'https://524900.xyz',
  trailingSlash: 'always',
  outDir: './dist',
  output: 'static',
  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['zh-CN'],
  },
  integrations: [
    vue(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // 排除 XML 端点等非 HTML 页面
      filter: (page) => !page.endsWith('.xml'),
    }),
  ],
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
