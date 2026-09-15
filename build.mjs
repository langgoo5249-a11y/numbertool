/**
 * 构建脚本：把 public/ 原样输出到 dist/
 *
 * 为什么保留一层 npm 构建，而不是让 Cloudflare Pages 直接发布 public/：
 *   1. public/ 里的 og-default.png、favicon 套件由 prebuild 阶段的 scripts/*.mjs 生成，需要先跑生成脚本；
 *   2. Cloudflare Pages 项目的构建命令与输出目录已配置为 `npm run build` / `dist`，
 *      保持这一约定即可不动后台设置直接部署。
 *
 * 零外部依赖，只用 Node 内置模块。
 * 同时把过程写入 build-report.txt，便于在 CI 日志被截断时排查。
 */
import { cpSync, rmSync, mkdirSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'public');
const out = join(root, 'dist');
const log = [];
const say = (s) => { log.push(s); console.log(s); };
const flush = () => { try { writeFileSync(join(root, 'build-report.txt'), log.join('\n') + '\n'); } catch { /* 忽略 */ } };

process.on('exit', flush);
process.on('uncaughtException', (e) => { say('✗ 未捕获异常: ' + (e && e.stack ? e.stack : e)); flush(); process.exitCode = 1; });

if (!existsSync(src)) {
  say('✗ 找不到 public/ 目录，构建中止');
  process.exitCode = 1;
} else {
  rmSync(out, { recursive: true, force: true });
  // 注意：不要先 mkdirSync(out) 再 cpSync(src, out)。当 out 已存在时，
  // Node 的 cpSync 按 `cp -r src out` 的语义会把整个 src 塞进 out 内部，
  // 产出 dist/public/... 这种多一层的结构。这里让 cpSync 自己创建 out。
  cpSync(src, out, { recursive: true });
  mkdirSync(out, { recursive: true });

  const walk = (dir, acc = []) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p, acc);
      else acc.push(relative(out, p).replace(/\\/g, '/'));
    }
    return acc;
  };

  const files = walk(out).sort();
  const must = ['index.html', '_headers', '_redirects', '404.html', 'robots.txt',
                'sitemap.xml', 'llms.txt', 'og-default.png', 'favicon.svg', 'favicon.ico'];
  const missing = must.filter((f) => !files.includes(f));

  say('✓ 已输出 ' + files.length + ' 个文件到 dist/');
  files.forEach((f) => say('    ' + f));
  if (missing.length) {
    say('✗ 缺少关键文件: ' + missing.join(', '));
    say('  提示：图片类文件由 prebuild 阶段的 scripts/*.mjs 生成，请用 npm run build 而非直接执行本文件');
    process.exitCode = 1;
  } else {
    say('✓ 关键文件齐全（' + must.length + ' 项）');
  }
}
