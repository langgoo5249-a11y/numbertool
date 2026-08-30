---
import type { APIRoute } from 'astro';
import MainLayout from '../layouts/MainLayout.astro';
import { SITE_URL, buildOgImage } from '../lib/seo';

export const GET: APIRoute = async () => {
  return new Response(null, { status: 301, headers: { Location: '/zh-CN/' } });
};
---
