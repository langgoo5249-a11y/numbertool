---
export const SITE_URL = 'https://www.524900.xyz';
export const SITE_NAME = '号码通查';
export const SITE_DESCRIPTION = '号码标记查询与清除服务平台，聚合中国信通院、360、腾讯等官方入口。手机号与座机号均支持，查询免费，不存储号码数据。';
export const LOCALES = ['zh-CN', 'en-US'] as const;
export type Locale = (typeof LOCALES)[number];

export function buildOgImage(title: string, subtitle = '') {
  const text = subtitle ? `${title} | ${subtitle}` : title;
  return `https://placehold.co/1200x630/1a1a2e/3B82F6?text=${encodeURIComponent(text.slice(0, 80))}`;
}

export function buildOpenGraph(opts: {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  image?: string;
  locale?: Locale;
}) {
  return {
    title: opts.title,
    description: opts.description,
    type: opts.type || 'website',
    url: `${SITE_URL}${opts.path.startsWith('/') ? opts.path : '/' + opts.path}`,
    siteName: SITE_NAME,
    locale: opts.locale === 'en-US' ? 'en_US' : 'zh_CN',
    images: [
      {
        url: opts.image || buildOgImage(opts.title),
        width: 1200,
        height: 630,
        alt: opts.title,
      },
    ],
  };
}

export function buildAlternates(path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const normPath = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`;

  return {
    canonical: `${SITE_URL}${normPath}`,
    languages: {
      'zh-CN': `${SITE_URL}/zh-CN${normPath}`,
      'en-US': `${SITE_URL}/en-US${normPath}`,
      'x-default': `${SITE_URL}/zh-CN${normPath}`,
    },
  };
}
