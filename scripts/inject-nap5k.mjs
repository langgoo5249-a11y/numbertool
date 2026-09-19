// 把 nap5k 广告脚本注入 public 下所有 HTML 页面的 <head> 标签之后。
// 幂等：若页面已包含 nap5k.com 则跳过。
// 用法：node scripts/inject-nap5k.mjs
// 说明：本仓库的 HTML 由 build-blog.mjs 生成后再由本脚本注入广告/统计；
//       重跑 `npm run blog` 后需再次执行本脚本与 inject-baidu-analytics.mjs。
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

const SNIPPET = `<script>(function(s){s.dataset.zone='11836608',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>`;

function collectHtml(dir, acc) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) collectHtml(p, acc);
    else if (name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const files = collectHtml(pub, []);
let injected = 0, skipped = 0;
for (const f of files) {
  let html = readFileSync(f, 'utf8');
  if (html.includes('nap5k.com')) { skipped++; continue; }
  if (!/<head[^>]*>/i.test(html)) { console.log('no head, skip: ' + f); continue; }
  html = html.replace(/<head[^>]*>/i, (m) => m + '\n' + SNIPPET);
  writeFileSync(f, html, 'utf8');
  injected++;
}
console.log('injected ' + injected + ' pages, skipped ' + skipped + ', total ' + files.length);
