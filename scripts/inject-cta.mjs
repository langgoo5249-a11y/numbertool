// 全站注入「加微悬浮条 + 转化事件埋点」。
// 幂等：若页面已含 id="wx-cta-bar" 则跳过。
// 用法：node scripts/inject-cta.mjs
// 说明：本仓库 HTML 由 build-blog.mjs 生成后再由注入脚本追加；重跑 `npm run blog` 后需重跑本脚本。
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

const SNIPPET = `<style>
#wx-cta-bar{position:fixed;left:0;right:0;bottom:0;z-index:9999;display:flex;align-items:center;gap:10px;justify-content:center;flex-wrap:wrap;padding:10px 14px;background:#0f172a;color:#fff;font-size:14px;box-shadow:0 -2px 12px rgba(0,0,0,.18)}
#wx-cta-bar b{color:#fbbf24}
#wx-cta-bar .wx-cta-copy{background:#fbbf24;color:#0f172a;border:0;border-radius:6px;padding:6px 12px;font-weight:600;cursor:pointer}
#wx-cta-bar .wx-cta-close{background:transparent;color:#fff;border:0;font-size:20px;line-height:1;cursor:pointer;padding:0 4px}
@media(max-width:600px){#wx-cta-bar{font-size:12px;padding:8px 10px;gap:6px}}
</style>
<div id="wx-cta-bar">
  <span class="wx-cta-txt">号码问题搞不定？加微信 <b>SXLH-888</b> 一对一帮你看</span>
  <button type="button" class="wx-cta-copy" data-wechat-copy="SXLH-888">复制微信号</button>
  <button type="button" class="wx-cta-close" data-wx-close aria-label="关闭">×</button>
</div>
<script src="/assets/track.js" defer></script>`;

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
  if (html.includes('id="wx-cta-bar"')) { skipped++; continue; }
  if (!/<\/body>/i.test(html)) { console.log('no </body>, skip: ' + f); continue; }
  html = html.replace(/<\/body>/i, (m) => SNIPPET + '\n' + m);
  writeFileSync(f, html, 'utf8');
  injected++;
}
console.log('cta injected ' + injected + ' pages, skipped ' + skipped + ', total ' + files.length);
