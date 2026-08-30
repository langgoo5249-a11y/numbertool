import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>号码通查 - 号码标记查询与清除服务平台</title>
    <description>号码标记查询与清除服务，聚合中国信通院、360、腾讯等官方入口。手机号与座机号均支持，查询免费，不存储号码数据。</description>
    <link>https://www.524900.xyz</link>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://www.524900.xyz/rss.xml" rel="self" type="application/rss+xml" />
    <item>
      <title>没打过电话却被标成骚扰电话？号码误标真相与清除指南</title>
      <description>号码误标三大来源、YD/T 4980-2024申诉依据与清除顺序，公安热线被误标真实案例。</description>
      <link>https://www.524900.xyz/zh-CN/blog/2026-number-false-marking-guide/</link>
      <guid>https://www.524900.xyz/zh-CN/blog/2026-number-false-marking-guide/</guid>
      <pubDate>${new Date('2026-08-28').toUTCString()}</pubDate>
    </item>
    <item>
      <title>号码为什么被AI自动标记？2026年标记算法规则</title>
      <description>标记背后的AI判定逻辑，为什么号码"莫名其妙"被标记。</description>
      <link>https://www.524900.xyz/zh-CN/blog/2026-ai-marking-algorithm-rules-guide/</link>
      <guid>https://www.524900.xyz/zh-CN/blog/2026-ai-marking-algorithm-rules-guide/</guid>
      <pubDate>${new Date('2026-08-19').toUTCString()}</pubDate>
    </item>
    <item>
      <title>手机厂商隐藏标记系统清除全攻略</title>
      <description>平台申诉清除后手机仍显示骚扰电话？华为/小米/OPPO/vivo/荣耀五大厂商独立本地标记库的清除方法。</description>
      <link>https://www.524900.xyz/zh-CN/blog/2026-phone-manufacturer-local-marking-database-clear-guide/</link>
      <guid>https://www.524900.xyz/zh-CN/blog/2026-phone-manufacturer-local-marking-database-clear-guide/</guid>
      <pubDate>${new Date('2026-08-12').toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`;
  
  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
