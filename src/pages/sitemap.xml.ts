import type { APIRoute } from 'astro';

const BASE_URL = 'https://www.524900.xyz';
const LOCALES = ['zh-CN', 'en-US'] as const;
const TODAY = new Date().toISOString().split('T')[0];

const STATIC_PAGES = [
  '',
  'tools/',
  'guide/',
  'compare/',
  'blog/',
  'faq/',
  'about/',
  'contact/',
  'privacy/',
  'terms/',
  'disclaimer/',
];

export const GET: APIRoute = async () => {
  const urls: { loc: string; lastmod: string; changefreq: string; priority: number }[] = [];

  // Add locale-based pages
  for (const locale of LOCALES) {
    for (const page of STATIC_PAGES) {
      const url = `${BASE_URL}/${locale}${page}`;
      urls.push({
        loc: url,
        lastmod: TODAY,
        changefreq: 'weekly',
        priority: page === '' ? 1.0 : 0.8,
      });
    }

    // Blog posts
    const blogPosts = [
      '2026-number-false-marking-guide',
      '2026-phone-manufacturer-local-marking-database-clear-guide',
      '2026-ai-marking-algorithm-rules-guide',
      '2026-recycled-number-false-marking-guide',
      '2026-enterprise-400-number-marking-clear-guide',
      '2026-high-frequency-outbound-number-marking-solution',
      '2026-number-marking-appeal-rejected-solutions',
      '2026-phone-marking-removal-complete-guide',
      '2026-phone-marking-recurrence-after-clearance',
      '2026-carrier-network-interception-guide',
      '2026-enterprise-number-marking-prevention-guide',
      '2026-enterprise-95-96-number-marking-clear-guide',
      '2026-phone-marking-removal-complete-guide-newbie',
    ];

    for (const post of blogPosts) {
      urls.push({
        loc: `${BASE_URL}/${locale}/blog/${post}/`,
        lastmod: TODAY,
        changefreq: 'monthly',
        priority: 0.7,
      });
    }

    // Tools
    const tools = ['marking-check', 'marking-clear', 'attribution', 'legal-number-verify', 'number-auth', 'registration-card', 'sim-cards'];
    for (const tool of tools) {
      urls.push({
        loc: `${BASE_URL}/${locale}/tools/${tool}/`,
        lastmod: TODAY,
        changefreq: 'weekly',
        priority: 0.9,
      });
    }

    // Guides
    const guides = [
      'what-is-number-marking',
      'how-to-check-marking',
      'how-to-clear-marking',
      'landline-marking-clear',
      'what-is-number-auth',
    ];
    for (const guide of guides) {
      urls.push({
        loc: `${BASE_URL}/${locale}/guide/${guide}/`,
        lastmod: TODAY,
        changefreq: 'monthly',
        priority: 0.7,
      });
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
