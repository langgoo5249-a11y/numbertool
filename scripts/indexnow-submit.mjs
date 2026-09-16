/**
 * 一键把站点主要 URL 提交到 IndexNow（必应 / 微软 即时收录加速）。
 *
 * 用途：每次发布新文章或更新页面后运行，让必应等搜索引擎近乎实时发现，
 * 从而显著缓解"新域名爬取配额有限"导致的内容收录滞后。
 *
 * 运行：node scripts/indexnow-submit.mjs            # 提交所有主页面 + 博客文章
 *       node scripts/indexnow-submit.mjs 仅新slug   # 只提交新增文章（不强制；IndexNow 幂等）
 *
 * 依赖：站点根目录须存在密钥文件 public/<KEY>.txt（已生成）。
 * 要求：提交的 URL 必须与密钥文件所在主机一致（www.524900.xyz）。
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.524900.xyz';
const KEY = '7aaa9f9ceea24a87852caf6cf9dbe6ec';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

// 固定主页面
const core = [
  '/', '/blog/', '/tools/marking-check.html', '/tools/marking-clear.html',
  '/tools/legal-number-verify.html', '/tools/attribution.html',
  '/guide/how-to-check.html', '/faq.html', '/about.html',
];

// 博客文章（posts.json 的键即 URL slug）
const posts = JSON.parse(readFileSync(join(root, 'blog-src/posts.json'), 'utf8'));
const blogUrls = Object.keys(posts).map((slug) => `${SITE}/blog/${slug}.html`);

const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const urls = only.length
  ? only.map((slug) => `${SITE}/blog/${slug}.html`)
  : [...core.map((p) => SITE + p), ...blogUrls];

const body = JSON.stringify({ host: 'www.524900.xyz', key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls });

console.log('提交到 IndexNow，URL 数 =', urls.length);
for (const u of urls) console.log('  -', u);
const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body });
console.log('HTTP 状态:', res.status, res.statusText);
const t = await res.text();
console.log(t ? '响应: ' + t : '（空响应，通常表示成功 = 202/200）');