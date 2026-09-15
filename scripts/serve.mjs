/**
 * 本地开发服务器：npm run dev
 *
 * 与生产（Cloudflare Pages）保持一致的两点：
 *   1. 静态文件从 dist/ 提供；
 *   2. /api/* 交给 functions/ 下的真实 Pages Function 处理 —— 不是 mock，
 *      而是直接 import 同一个模块，本地验证的就是线上要跑的那份代码。
 *
 * 零外部依赖。
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, dirname, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dist = join(root, 'dist');
const fnDir = join(root, 'functions');
const PORT = Number(process.env.PORT || 4321);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

// 按请求路径解析对应的 Pages Function 模块
async function loadFunction(pathname) {
  const rel = pathname.replace(/^\/api\/?/, '');
  const candidates = [
    join(fnDir, 'api', rel + '.js'),          // /api/attribution      -> functions/api/attribution.js
    join(fnDir, 'api', rel, 'index.js'),      // /api/attribution/xxx  -> functions/api/attribution/index.js
  ];
  for (const c of candidates) {
    try {
      if ((await stat(c)).isFile()) {
        const mod = await import(pathToFileURL(c).href);
        return mod;
      }
    } catch { /* 继续尝试下一个 */ }
  }
  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
  let pathname = decodeURIComponent(url.pathname);

  // ---- /api/* 交给真实 Function ----
  if (pathname.startsWith('/api/')) {
    const mod = await loadFunction(pathname);
    if (!mod) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      return void res.end(JSON.stringify({ ok: false, error: 'no such function' }));
    }
    const fn = req.method === 'POST'
      ? (mod.onRequestPost || mod.onRequest)
      : (mod.onRequestGet || mod.onRequest);
    if (!fn) {
      res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
      return void res.end(JSON.stringify({ ok: false, error: 'method not allowed' }));
    }
    const request = new Request(url.href, { method: req.method, headers: req.headers });
    const out = await fn({ request, env: process.env, params: {}, data: {} });
    res.writeHead(out.status, Object.fromEntries(out.headers));
    return void res.end(Buffer.from(await out.arrayBuffer()));
  }

  // ---- 静态文件 ----
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = join(dist, normalize(pathname).replace(/^(\.\.[/\\])+/, ''));
  try {
    const s = await stat(file);
    if (s.isDirectory()) {
      res.writeHead(302, { Location: pathname + '/' });
      return void res.end();
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    try {
      res.writeHead(404, { 'Content-Type': MIME['.html'] });
      res.end(await readFile(join(dist, '404.html')));
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404');
    }
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`本地预览: http://127.0.0.1:${PORT}/  （/api/* 由 functions/ 下的真实 Pages Function 处理）`);
});
