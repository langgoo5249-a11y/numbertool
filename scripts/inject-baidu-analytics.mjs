/**
 * 把百度统计(Baidu Tongji)代码注入 public/ 下所有 HTML 页面的 </head> 前。
 * 幂等：若页面已包含 hm.baidu.com 则跳过。
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

const SNIPPET = `<!-- 百度统计 (Baidu Analytics) -->
<script>
var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?5e64632129c7f5596909d0005c8efd44";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();
</script>
`;

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
  if (html.includes('hm.baidu.com')) { skipped++; continue; }
  if (!html.includes('</head>')) { console.log('✗ 无 </head>，跳过: ' + f); continue; }
  html = html.replace('</head>', SNIPPET + '</head>');
  writeFileSync(f, html, 'utf8');
  injected++;
}
console.log('√ 注入 ' + injected + ' 个页面，已存在跳过 ' + skipped + ' 个，共 ' + files.length + ' 个 HTML');