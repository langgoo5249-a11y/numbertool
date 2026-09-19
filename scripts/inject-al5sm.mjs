/**
 * 将 al5sm 广告脚本注入 public/ 下所有 HTML 页面的 </head> 前（即 <head> 标签之后、</head> 之前）。
 * 幂等：若页面已包含 al5sm.com 则跳过。
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

const SNIPPET = `<script>(function(s){s.dataset.zone='11829804',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>`;

function collectHtml(dir, acc) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) collectHtml(p, acc);
    else if (name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const files = collectHtml(pub, []);
let injected = 0;
let skipped = 0;
for (const f of files) {
  let html = readFileSync(f, 'utf8');
  if (html.includes('al5sm.com')) { skipped++; continue; }
  if (!html.includes('</head>')) { console.log('✗ 无 </head>，跳过: ' + f); continue; }
  html = html.replace('</head>', SNIPPET + '</head>');
  writeFileSync(f, html, 'utf8');
  injected++;
}
console.log('√ 注入 ' + injected + ' 个页面，已存在跳过 ' + skipped + ' 个，共 ' + files.length + ' 个 HTML');
