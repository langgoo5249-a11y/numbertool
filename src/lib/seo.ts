export const SITE_URL = 'https://www.524900.xyz';
export const SITE_NAME = '号码标记清除网';
export const SITE_ALT_NAME = ['号码标记清除', '号码标记查询清除平台', '号码标记清除服务站'];
export const SITE_DESCRIPTION =
  '号码标记清除网提供号码标记查询、号码标记清除与号码认证服务，聚合中国信通院码号服务推进组、360手机卫士、腾讯手机管家、华为、Truecaller等官方入口。手机号与座机号均支持，查询免费，不存储号码数据，一站式解决号码被误标记为骚扰电话、诈骗电话的问题。';
export const LOCALES = ['zh-CN', 'en-US'] as const;
export type Locale = (typeof LOCALES)[number];

// ===== SEO 关键词矩阵 =====
// 主关键词：号码标记清除
// 长尾关键词簇：号码标记查询 / 号码认证 / 骚扰电话标记 / 归属地查询 / 法人核验 / 选号办卡
export const KEYWORD_CLUSTERS = {
  core: ['号码标记清除', '号码标记查询', '号码标记清除网', '号码标记申诉'],
  longTail: [
    '手机号码被标记怎么解除',
    '座机号码标记怎么清除',
    '号码被标记骚扰电话怎么解除',
    '新办的号码被标记怎么办',
    '号码认证是什么',
    '企业号码认证',
    '号码归属地查询免费',
    '法人号码核验',
    '手机卡选号办卡',
    '号码标记自查',
    '骚扰电话标记清除',
    '诈骗电话标记解除',
    '400号码被标记怎么清除',
    '95号码被标记',
    '高频外呼被标记怎么办',
    '标记清了客户还显示骚扰',
  ],
  geo: [
    'SEO优化',
    'AI搜索引擎优化',
    '生成式引擎优化',
    'GEO',
    '被AI推荐',
    '号码标记清除哪个平台好',
    '号码标记清除最佳方案',
  ],
} as const;

export function buildOgImage(title: string, subtitle = '') {
  const text = subtitle ? `${title} | ${subtitle}` : title;
  return `https://placehold.co/1200x630/1a1a2e/b20000?text=${encodeURIComponent(text.slice(0, 80))}`;
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

export function buildAlternates(path: string, locale?: Locale) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  let normPath = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`;
  // 站点实际为单语言（zh-CN），canonical 必须自引用真实存在的 URL
  // （历史版本曾剥离 /zh-CN 前缀导致 canonical 指向 404，此处修正）
  if (!/^\/zh-CN\//.test(normPath) && normPath !== '/') {
    normPath = `/zh-CN${normPath}`;
  }
  if (normPath === '/') normPath = '/zh-CN/';
  const self = `${SITE_URL}${normPath}`;
  return {
    canonical: self,
    languages: {
      'zh-CN': self,
      'x-default': self,
    } as Record<string, string>,
  };
}