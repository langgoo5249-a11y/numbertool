import type { APIRoute } from 'astro';

// 与 blog/index.astro 保持同步的文章清单（按日期倒序）
const POSTS = [
  { slug: '2026-number-false-marking-guide', title: '没打过电话却被标成骚扰电话？号码误标真相与清除指南', date: '2026-08-28', desc: '号码误标三大来源、YD/T 4980-2024申诉依据与清除顺序，公安热线被误标真实案例。' },
  { slug: '2026-carrier-network-interception-guide', title: '标记全清除了电话还是打不通？运营商网络侧拦截排查', date: '2026-08-25', desc: '运营商网络侧拦截机制拆解，移动/电信/联通拦截判定特征与解除方案。' },
  { slug: '2026-phone-marking-recurrence-after-clearance', title: '号码标记清除后为何又会复标？826个号码追踪发现', date: '2026-08-21', desc: '追踪826个号码发现80%复标集中在3个高危时间窗口，附防复标方案。' },
  { slug: '2026-ai-marking-algorithm-rules-guide', title: '号码为什么被AI自动标记？2026年标记算法规则拆解', date: '2026-08-19', desc: '标记背后的AI判定逻辑，为什么号码"莫名其妙"被标记，以及如何规避。' },
  { slug: '2026-phone-manufacturer-local-marking-database-clear-guide', title: '手机厂商隐藏标记系统清除全攻略（华为/小米/OPPO/vivo/荣耀）', date: '2026-08-12', desc: '平台申诉清除后手机仍显示骚扰电话？五大厂商独立本地标记库的清除方法。' },
  { slug: '2026-high-frequency-outbound-number-marking-solution', title: '高频外呼号码防标记方案：销售/客服外呼不被打标', date: '2026-07-23', desc: '销售/客服等高频外呼场景的号码标记预防与清除完整方案。' },
  { slug: '2026-number-marking-appeal-rejected-solutions', title: '号码标记申诉被驳回怎么办？六大平台驳回原因对照', date: '2026-07-21', desc: '六大平台驳回原因对照表与二次申诉技巧，一次通过率提升指南。' },
  { slug: '2026-enterprise-number-marking-prevention-guide', title: '企业号码标记预防与防回流指南：标记清了不再回来', date: '2026-07-15', desc: '企业号码清理标记后防止再次被打标回流的方法，实现长效防标记。' },
  { slug: '2026-enterprise-400-number-marking-clear-guide', title: '企业400号码标记清除完全攻略', date: '2026-07-13', desc: '400号码被标记怎么清除？完整流程、材料清单与注意事项。' },
  { slug: '2026-recycled-number-false-marking-guide', title: '二次号码被标记骚扰电话怎么办？新办手机号误标清除', date: '2026-07-07', desc: '新办手机号误标记清除全攻略，工信部"二次号码焕新"服务解读。' },
  { slug: '2026-enterprise-95-96-number-marking-clear-guide', title: '95/96号码被标记怎么清除？企业95/96号段标记清除方案', date: '2026-07-03', desc: '95/96企业短号被标记怎么处理？分平台申诉与号码认证组合方案。' },
  { slug: '2026-phone-marking-removal-complete-guide', title: '号码标记清除完整流程：从查询到复测的全步骤指南', date: '2026-06-30', desc: '从标记查询、材料准备、分平台申诉到多品牌复测的完整清除指南。' },
  { slug: '2026-phone-marking-removal-complete-guide-newbie', title: '号码标记清除完全指南（新手版）：第一次被标记别慌', date: '2026-06-25', desc: '第一次被标记骚扰电话该怎么处理？给新手的一步步号码标记清除入门指南。' },
];

export const GET: APIRoute = async () => {
  const items = POSTS.map(
    (p) => `    <item>
      <title>${p.title}</title>
      <description>${p.desc}</description>
      <link>https://524900.xyz/zh-CN/blog/${p.slug}/</link>
      <guid>https://524900.xyz/zh-CN/blog/${p.slug}/</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    </item>`
  ).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>号码标记清除网 - 号码标记查询/清除/认证服务</title>
    <description>提供号码标记查询、号码标记清除与号码认证服务，聚合中国信通院码号服务推进组、360、腾讯、华为、Truecaller等官方入口。手机号与座机号均支持，查询免费，不存储号码数据。</description>
    <link>https://524900.xyz/zh-CN/</link>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://524900.xyz/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
