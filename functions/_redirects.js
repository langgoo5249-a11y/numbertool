// Cloudflare Pages 钩子：308 重定向归一，避免爬虫浪费抓取配额
// 两类必应"爬取能力有限"的重复 URL 来源：
//  1. /index.html 与 / 同时可访问 —— 同一页面两个 URL，重复抓取
//  2. /path?any=param 返回 200 —— 任意查询参数 URL 都能访问，参数 URL 与原页内容一致，是重复内容
// 308 是"永久+保留方法"状态码，比 301 更适合 POST 等场景；对爬虫而言，等价于"请只用规范 URL"。

export function onRequestStart(context) {
  const { request } = context;
  const url = new URL(request.url);
  const host = url.host;

  // 规则 1：/index.html → /
  if (url.pathname === '/index.html') {
    url.pathname = '/';
    url.search = '';
    url.hash = '';
    context.respondWith(
      new Response(null, {
        status: 308,
        headers: { Location: `https://${host}/` }
      })
    );
    return;
  }

  // 规则 2：任意带查询参数的 URL → 去掉参数（保留 path）
  // 注意：不重定向 /api/*，那是函数路由的入口，由 functions/api/attribution.js 处理
  if (url.search && !url.pathname.startsWith('/api/')) {
    const clean = url.pathname || '/';
    context.respondWith(
      new Response(null, {
        status: 308,
        headers: { Location: `https://${host}${clean}` }
      })
    );
    return;
  }
}
