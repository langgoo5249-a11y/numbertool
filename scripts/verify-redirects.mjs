// 本地模拟 Cloudflare Pages 钩子，验证 functions/_redirects.js 的 308 重定向行为
// 不修改任何文件；只读取并测试钩子逻辑，输出期望结果。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.join(here, '..', 'functions', '_redirects.js'), 'utf8');

// 把 onRequestStart 暴露成可测函数：把 export 去掉，eval 一段
const stripped = src.replace('export function onRequestStart', 'globalThis.onRequestStart = function onRequestStart');
new Function(stripped)();

const HOST = 'www.524900.xyz';
const cases = [
  // [path, 期望 action, 期望 Location]
  ['/', 'static', null],
  ['/index.html', 'redirect', 'https://www.524900.xyz/'],
  ['/?x=1', 'redirect', 'https://www.524900.xyz/'],
  ['/tools/two-factor-verify.html', 'static', null],
  ['/tools/two-factor-verify.html?utm=bing', 'redirect', 'https://www.524900.xyz/tools/two-factor-verify.html'],
  ['/blog/2026-phone-marking-removal-complete-guide/', 'static', null],
  ['/blog/2026-phone-marking-removal-complete-guide/?ref=x', 'redirect', 'https://www.524900.xyz/blog/2026-phone-marking-removal-complete-guide/'],
  ['/api/attribution?phone=13800000000', 'static', null], // api 不重定向
  ['/404.html', 'static', null],
  ['/robots.txt', 'static', null],
  ['/sitemap.xml', 'static', null],
];

let ok = 0, fail = 0;
for (const [p, expectedAction, expectedLoc] of cases) {
  const request = new Request(`https://${HOST}${p}`);
  const context = { request, respondWith(res) { this._res = res; } };
  onRequestStart(context);
  const r = context._res;
  if (!r) {
    if (expectedAction === 'static') { ok++; console.log(`✓ ${p} → 无响应(交给静态托管) [OK]`); }
    else { fail++; console.log(`✗ ${p} → 期望 redirect 但无响应 [FAIL]`); }
    continue;
  }
  const status = r.status;
  const loc = r.headers.get('Location');
  if (expectedAction === 'redirect') {
    if (status === 308 && loc === expectedLoc) { ok++; console.log(`✓ ${p} → 308 ${loc} [OK]`); }
    else { fail++; console.log(`✗ ${p} → 期望 308 ${expectedLoc}，实际 ${status} ${loc} [FAIL]`); }
  } else {
    if (status !== 308) { ok++; console.log(`✓ ${p} → 静态放行 [OK]`); }
    else { fail++; console.log(`✗ ${p} → 期望静态放行，实际 ${status} ${loc} [FAIL]`); }
  }
}
console.log(`\n== ${ok} 通过 / ${fail} 失败 ==`);
process.exit(fail ? 1 : 0);
