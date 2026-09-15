/* ============================================================
   号通查 — 号码百科 / 常见问题 静态页生成器
   ------------------------------------------------------------
   把 blog-src/posts.json 里的文章与 blog-src/faqs.json 里的问答，
   按新站版式渲染成纯静态 HTML。

   设计取舍：渲染在本地一次性完成，产物（public/blog/*.html、
   public/faq.html、public/rss.xml、public/sitemap.xml）直接提交进仓库，
   所以线上构建保持「零依赖、build 只做拷贝」的既有架构不变。

   用法：
     npm i -D marked     # 仅首次，本地需要
     npm run blog        # 重新生成文章页 / FAQ / RSS / sitemap

   ⚠ 会重写以下文件，手改这些文件会在下次生成时被覆盖：
     public/blog/index.html、public/blog/<slug>.html
     public/faq.html、public/rss.xml、public/sitemap.xml
   文章内容请改 blog-src/posts.json，问答请改 blog-src/faqs.json。
   ============================================================ */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// marked 只在「本地重新生成文章」时需要，不参与线上构建。
// 线上构建（npm run build）只做 public/ -> dist/ 的拷贝，不依赖任何 npm 包。
let marked;
try {
  ({ marked } = await import('marked'));
} catch {
  console.error(
    '\n[build-blog] 缺少构建期依赖 marked。它只用于本地重新生成文章页：\n' +
      '  npm i -D marked\n' +
      '（线上部署不需要它，未安装也不影响 npm run build）\n'
  );
  process.exit(1);
}

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PUB = path.join(ROOT, 'public');
const SRC = path.join(ROOT, 'blog-src');

const ORIGIN = 'https://www.524900.xyz';
const BRAND = '号通查';

marked.setOptions({ gfm: true, breaks: true });

/* ---------------- helpers ---------------- */
const escAttr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ldScript = (obj) =>
  '<script type="application/ld+json">\n' + JSON.stringify(obj, null, 2) + '\n</script>';

/* 旧站内链 → 新站页面（{p} 为相对根的前缀：blog/ 下是 '../'，根目录下是 ''） */
const LINK_TABLE = [
  [/^\/zh-CN\/?$/, '{p}index.html'],
  [/^\/zh-CN\/tools\/marking-check\/?/, '{p}tools/marking-check.html'],
  [/^\/zh-CN\/tools\/marking-clear\/?/, '{p}tools/marking-clear.html'],
  [/^\/zh-CN\/tools\/attribution\/?/, '{p}tools/attribution.html'],
  [/^\/zh-CN\/tools\/legal-number-verify\/?/, '{p}tools/legal-number-verify.html'],
  [/^\/zh-CN\/tools\/number-auth\/?/, '{p}tools/marking-clear.html'],
  [/^\/zh-CN\/guide\/how-to-check-marking\/?/, '{p}guide/how-to-check.html'],
  [/^\/zh-CN\/guide\/how-to-clear-marking\/?/, '{p}guide/how-to-check.html'],
  [/^\/zh-CN\/guide\/[a-z-]+\/?/, '{p}guide/how-to-check.html'],
  [/^\/zh-CN\/faq\/?/, '{p}faq.html'],
  [/^\/zh-CN\/about\/?/, '{p}about.html'],
  [/^\/zh-CN\/contact\/?/, '{p}about.html'],
  [/^\/zh-CN\/compare\/[a-z-]+\/?/, '{p}guide/how-to-check.html'],
];

function rewriteHref(href, p = '../') {
  if (!href) return href;
  if (/^(https?:|mailto:|tel:|#|data:)/i.test(href)) return href;

  // 旧站博客内链 → 同目录兄弟页
  const blog = href.match(/^\/zh-CN\/blog\/([^/?#]+)\/?(.*)$/);
  if (blog) return blog[1] + '.html' + (blog[2] || '');

  for (const [re, to] of LINK_TABLE) {
    if (re.test(href)) return to.replace('{p}', p);
  }
  // 其余 /zh-CN/... 旧路径统一兜底到自查指南
  if (href.startsWith('/zh-CN/')) return `${p}guide/how-to-check.html`;
  return href;
}

/* 把 markdown 内链改写掉（在渲染前处理，保证 anchor 文本不受影响） */
function rewriteMarkdownLinks(md, p = '../') {
  return md.replace(/\]\(([^)\s]+)([^)]*)\)/g, (full, href, rest) => {
    const out = rewriteHref(href, p);
    return `](${out}${rest || ''})`;
  });
}

/* 品牌与站点自指替换 */
function rebrand(text) {
  return text
    .replace(/号码标记清除网/g, BRAND)
    .replace(/zangxixitech\.cn/g, 'www.524900.xyz')
    .replace(/https:\/\/www\.524900\.xyz\/zh-CN\//g, ORIGIN + '/');
}

/* markdown → 正文 HTML */
function renderBody(md) {
  let src = md.replace(/^\s*#\s+[^\n]*\n/, ''); // 去掉与页面 H1 重复的首行标题
  src = rewriteMarkdownLinks(src);
  src = rebrand(src);
  let html = marked.parse(src);
  // 表格套 .tbl-wrap（与站内既有版式一致，窄屏可横向滚动）
  html = html.replace(/<table>/g, '<div class="tbl-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  return html;
}

/* FAQ 答案：旧站是把 markdown 原样当纯文本渲染的（链接会露出 [文字](地址)）。
   这里改成正常渲染 markdown 并改写内链，属于对旧站缺陷的修正。 */
function renderFaqAnswer(a) {
  const src = rebrand(rewriteMarkdownLinks(a));
  let html = marked.parseInline(src);
  // 单个段落时去掉外层 <p>，避免在 .faq-a 里多出一层间距
  html = html.replace(/^<p>([\s\S]*)<\/p>$/, '$1');
  return html;
}

/* 结构化数据里要纯文本：去掉链接语法与强调标记 */
function mdToPlain(s) {
  return rebrand(s)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .trim();
}

/* ---------------- 全站导航 / 页头页脚 ---------------- */
const NAV_ITEMS = [
  ['首页', 'index.html'],
  ['标记自查', 'tools/marking-check.html'],
  ['标记清除', 'tools/marking-clear.html'],
  ['法人核验', 'tools/legal-number-verify.html'],
  ['归属地查询', 'tools/attribution.html'],
  ['自查指南', 'guide/how-to-check.html'],
  ['号码百科', 'blog/'],
  ['关于本站', 'about.html'],
];

function header(p, onKey) {
  const links = NAV_ITEMS.map(([label, href]) => {
    const on = label === onKey ? ' class="on"' : '';
    return `      <a href="${p}${href}"${on}>${label}</a>`;
  }).join('\n');
  return `<header class="site-header">
  <div class="inner">
    <a class="logo" href="${p}index.html">
      <span class="mark">号通</span>
      <span>${BRAND}<small>号码标记查询与清除</small></span>
    </a>
    <nav class="nav">
${links}
    </nav>
  </div>
</header>`;
}

function footer(p) {
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="cols">
      <div>
        <h4>${BRAND}</h4>
        <p class="xs muted" style="margin:0">
          号码标记自查、申诉材料准备、法人号码核验预检、归属地查询。<br>
          本站不代替各平台查询，只帮你把流程和材料理清。
        </p>
      </div>
      <div>
        <h4>工具</h4>
        <ul>
          <li><a href="${p}tools/marking-check.html">号码标记自查</a></li>
          <li><a href="${p}tools/marking-clear.html">申诉材料生成器</a></li>
          <li><a href="${p}tools/legal-number-verify.html">法人号码核验预检</a></li>
          <li><a href="${p}tools/attribution.html">归属地查询</a></li>
        </ul>
      </div>
      <div>
        <h4>说明</h4>
        <ul>
          <li><a href="${p}about.html">关于本站与数据来源</a></li>
          <li><a href="${p}guide/how-to-check.html">号码标记自查指南</a></li>
          <li><a href="${p}blog/">号码百科（全部文章）</a></li>
          <li><a href="${p}faq.html">常见问题 FAQ</a></li>
        </ul>
      </div>
    </div>
    <p class="fine">
      所有官方申诉入口均为免费。遇到声称「加急」「内部渠道」「包过」的付费代办，请直接关闭页面。
      站内不存储用户输入的号码，身份证号等敏感信息仅在浏览器本地校验。申诉时效以平台最新公示为准。
    </p>
  </div>
</footer>`;
}

/* ---------------- 页面骨架 ---------------- */
function page({ p, title, desc, canonical, ogType = 'website', navOn = '', keywords = '', crumbs = '', body, ld = [] }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escAttr(title)}</title>
<meta name="description" content="${escAttr(desc)}">
<!-- seo-head:begin (由 _build/inject_seo.py 生成，勿手改) -->
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:locale" content="zh_CN">
<meta property="og:title" content="${escAttr(title)}">
<meta property="og:description" content="${escAttr(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ORIGIN}/og-default.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escAttr(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escAttr(title)}">
<meta name="twitter:description" content="${escAttr(desc)}">
<meta name="twitter:image" content="${ORIGIN}/og-default.png">
<!-- seo-head:end -->
<meta name="robots" content="index,follow">${keywords ? `\n<meta name="keywords" content="${escAttr(keywords)}">` : ''}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="${p}assets/style.css">
${ld.map(ldScript).join('\n')}
</head>
<body>

${header(p, navOn)}

<main class="wrap" style="padding-top:32px">

${crumbs}
${body}

</main>

${footer(p)}

<script src="${p}assets/data.js"></script>
<script src="${p}assets/app.js"></script>
</body>
</html>
`;
}

const crumbsHtml = (items) =>
  `<nav class="crumbs" aria-label="面包屑">\n  ` +
  items
    .map((it, i) => {
      const sep = i ? '<span class="sep">›</span>' : '';
      return sep + (it[1] ? `<a href="${it[1]}">${escAttr(it[0])}</a>` : `<span class="cur">${escAttr(it[0])}</span>`);
    })
    .join('') +
  `\n</nav>`;

/* ---------------- 载入文章 ---------------- */
const posts = JSON.parse(fs.readFileSync(path.join(SRC, 'posts.json'), 'utf8'));
const slugs = Object.keys(posts);
const byDateDesc = slugs.slice().sort((a, b) => (posts[a].date < posts[b].date ? 1 : -1));

/* 相关阅读：标签交集优先，其次按日期 */
function related(slug, n = 3) {
  const self = posts[slug];
  return slugs
    .filter((s) => s !== slug)
    .map((s) => ({ slug: s, ...posts[s], overlap: posts[s].tags.filter((t) => self.tags.includes(t)).length }))
    .sort((a, b) => b.overlap - a.overlap || b.date.localeCompare(a.date))
    .slice(0, n);
}

/* 精简标题（面包屑用）：截到第一个问号/冒号前，避免过长 */
function shortTitle(t) {
  let s = t.split(/[？?：:｜|]/)[0].trim();
  if (s.length > 22) s = s.slice(0, 22) + '…';
  return s || t;
}

/* ============================================================
   1. 文章页
   ============================================================ */
let written = [];
for (const slug of slugs) {
  const post = posts[slug];
  const url = `${ORIGIN}/blog/${slug}.html`;
  const dateModified = post.updated || post.date;
  const bodyHtml = renderBody(post.content);

  const idx = byDateDesc.indexOf(slug);
  const newer = idx > 0 ? byDateDesc[idx - 1] : null;
  const older = idx < byDateDesc.length - 1 ? byDateDesc[idx + 1] : null;

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      inLanguage: 'zh-CN',
      articleSection: '号码百科',
      datePublished: post.date,
      dateModified,
      keywords: post.tags.join(','),
      author: { '@type': 'Organization', name: BRAND, url: `${ORIGIN}/` },
      publisher: {
        '@type': 'Organization',
        name: BRAND,
        url: `${ORIGIN}/`,
        logo: { '@type': 'ImageObject', url: `${ORIGIN}/favicon-512.png`, width: 512, height: 512 },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '首页', item: `${ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: '号码百科', item: `${ORIGIN}/blog/` },
        { '@type': 'ListItem', position: 3, name: shortTitle(post.title), item: url },
      ],
    },
  ];

  if (post.faq && post.faq.length) {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faq.map((f) => ({
        '@type': 'Question',
        name: mdToPlain(f.q),
        acceptedAnswer: { '@type': 'Answer', text: mdToPlain(f.a) },
      })),
    });
  }

  const faqHtml = post.faq && post.faq.length
    ? `
    <section class="mt3" aria-label="常见问题">
      <h2 class="mt0" style="border-top:none">本文常见问题</h2>
      <div class="faq-list">
${post.faq
  .map(
    (f) => `        <details class="faq-item">
          <summary>${escAttr(mdToPlain(f.q))}</summary>
          <div class="faq-a">${renderFaqAnswer(f.a)}</div>
        </details>`
  )
  .join('\n')}
      </div>
    </section>`
    : '';

  const relatedHtml = `
    <section class="mt3" aria-label="相关阅读">
      <h2 style="border-top:none">相关阅读</h2>
      <div class="bloglist">
${related(slug)
  .map(
    (r) => `        <a class="bcard" href="${r.slug}.html">
          <time class="bdate" datetime="${r.date}">${r.date}</time>
          <h3>${escAttr(r.title)}</h3>
          <p>${escAttr(r.excerpt)}</p>
          <div class="btags">${r.tags.slice(0, 3).map((t) => `<span>${escAttr(t)}</span>`).join('')}</div>
        </a>`
  )
  .join('\n')}
      </div>
    </section>`;

  const metaParts = [`<time datetime="${post.date}">发布于 ${post.date}</time>`];
  if (post.updated) metaParts.push(`<span>·</span><time datetime="${post.updated}">更新于 ${post.updated}</time>`);

  const pagerHtml = (newer || older)
    ? `
    <nav class="pager" aria-label="上一篇/下一篇">
      ${older
        ? `<a href="${older}.html"><span>← 更早一篇</span>${escAttr(posts[older].title)}</a>`
        : '<a class="muted" href="index.html"><span>← 返回</span>号码百科全部文章</a>'}
      ${newer
        ? `<a class="tr" href="${newer}.html"><span>更新一篇 →</span>${escAttr(posts[newer].title)}</a>`
        : `<a class="tr" href="index.html"><span>返回 →</span>号码百科全部文章</a>`}
    </nav>`
    : '';

  const body = `
<div class="article">
    ${crumbsHtml([['首页', '../index.html'], ['号码百科', './'], [shortTitle(post.title)]]).replace(
      '<nav class="crumbs"',
      '<nav class="crumbs" style="margin-left:-2px"'
    )}
    <h1 class="mt0">${escAttr(post.title)}</h1>
    <div class="article-meta">
      ${metaParts.join('\n      ')}
      <span>·</span><span>${escAttr(post.tags.join(' · '))}</span>
    </div>
    <p class="lead-in">${escAttr(post.excerpt)}</p>

${bodyHtml}
${faqHtml}

    <aside class="alert alert-info mt3" aria-label="下一步">
      <strong>下一步：</strong>先查清你的号码在各大平台的实际标记状态，再决定申诉策略。
      <a href="../tools/marking-check.html">用号码标记自查向导生成清单 →</a>
      查询免费，站内不存储号码数据。
    </aside>

    ${pagerHtml}
</div>
${relatedHtml}`;

  const html = page({
    p: '../',
    title: `${post.title} - ${BRAND}`,
    desc: post.excerpt,
    canonical: url,
    ogType: 'article',
    navOn: '号码百科',
    keywords: post.tags.join(','),
    crumbs: '',
    body,
    ld,
  });

  const outDir = path.join(PUB, 'blog');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${slug}.html`), html, 'utf8');
  written.push(`blog/${slug}.html`);
}

/* ============================================================
   2. 列表页 /blog/index.html
   ============================================================ */
// 标签按出现次数降序（常用的排前面），同频按名称排
const tagCounts = {};
for (const s of slugs) for (const t of posts[s].tags) tagCounts[t] = (tagCounts[t] || 0) + 1;
const allTags = Object.keys(tagCounts).sort(
  (a, b) => tagCounts[b] - tagCounts[a] || a.localeCompare(b, 'zh')
);

const listBody = `
<div class="sect" style="padding-top:0">
    ${crumbsHtml([['首页', '../index.html'], ['号码百科']])}
    <h1>号码百科</h1>
    <p class="lead-in">
      号码标记、标记清除、号码认证、归属地查询相关的深度文章，共 ${slugs.length} 篇。
      每篇都写明渠道、材料与时效，并在结尾给出可直接执行的下一步。
    </p>

    <div class="bfilter" id="bfilter" role="group" aria-label="按标签筛选">
      <button class="chip on" data-tag="__all">全部 ${slugs.length}</button>
${allTags
  .map((t) => `      <button class="chip" data-tag="${escAttr(t)}">${escAttr(t)} ${tagCounts[t]}</button>`)
  .join('\n')}
    </div>
    <button class="chip chip-more" id="btoggle" hidden></button>

    <div class="bloglist" id="bloglist">
${byDateDesc
  .map(
    (s) => `      <a class="bcard" href="${s}.html" data-tags="${escAttr(posts[s].tags.join('|'))}">
        <time class="bdate" datetime="${posts[s].date}">${posts[s].date}</time>
        <h3>${escAttr(posts[s].title)}</h3>
        <p>${escAttr(posts[s].excerpt)}</p>
        <div class="btags">${posts[s].tags.map((t) => `<span>${escAttr(t)}</span>`).join('')}</div>
      </a>`
  )
  .join('\n')}
    </div>
    <p class="xs muted2 mt2 mb0" id="blogcount"></p>
</div>`;

const listLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${BRAND} · 号码百科`,
    description: '号码标记查询与清除相关的深度文章合集。',
    inLanguage: 'zh-CN',
    url: `${ORIGIN}/blog/`,
    publisher: { '@type': 'Organization', name: BRAND, url: `${ORIGIN}/` },
    blogPost: byDateDesc.map((s) => ({
      '@type': 'BlogPosting',
      headline: posts[s].title,
      description: posts[s].excerpt,
      url: `${ORIGIN}/blog/${s}.html`,
      datePublished: posts[s].date,
      dateModified: posts[s].updated || posts[s].date,
      keywords: posts[s].tags.join(','),
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '首页', item: `${ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: '号码百科', item: `${ORIGIN}/blog/` },
    ],
  },
];

const listHtml = page({
  p: '../',
  title: `号码百科：号码标记与清除文章合集（共 ${slugs.length} 篇） - ${BRAND}`,
  desc: `号码被标记、标记怎么清除、申诉被驳回怎么办、座机与400号码怎么处理——${slugs.length} 篇深度文章，按平台渠道与材料要求写清步骤。`,
  canonical: `${ORIGIN}/blog/`,
  ogType: 'website',
  navOn: '号码百科',
  keywords: allTags.join(','),
  crumbs: '',
  body: listBody,
  ld: listLd,
});

const listFilter = `
<script>
  (function () {
    var list = document.getElementById('bloglist');
    if (!list) return;
    var cards = [].slice.call(list.querySelectorAll('.bcard'));
    var chips = [].slice.call(document.querySelectorAll('#bfilter .chip'));
    var count = document.getElementById('blogcount');

    function apply(tag) {
      var shown = 0;
      cards.forEach(function (c) {
        var tags = (c.getAttribute('data-tags') || '').split('|');
        var ok = tag === '__all' || tags.indexOf(tag) >= 0;
        c.style.display = ok ? '' : 'none';
        if (ok) shown++;
      });
      chips.forEach(function (ch) { ch.classList.toggle('on', ch.getAttribute('data-tag') === tag); });
      if (count) count.textContent = '当前显示 ' + shown + ' / ' + cards.length + ' 篇';
      try {
        var u = new URL(location.href);
        if (tag === '__all') u.searchParams.delete('tag'); else u.searchParams.set('tag', tag);
        history.replaceState(null, '', u);
      } catch (e) {}
    }

    chips.forEach(function (ch) {
      ch.addEventListener('click', function () { apply(ch.getAttribute('data-tag')); });
    });

    var init = new URLSearchParams(location.search).get('tag');
    apply(init && chips.some(function (c) { return c.getAttribute('data-tag') === init; }) ? init : '__all');

    // 标签过多时在窄屏默认折叠，避免筛选条占据大半屏
    var filter = document.getElementById('bfilter');
    var toggle = document.getElementById('btoggle');
    if (filter && toggle) {
      var mq = window.matchMedia('(max-width: 760px)');
      function setClipped(v) {
        filter.classList.toggle('clipped', v);
        toggle.textContent = v ? '展开全部 ' + (chips.length - 1) + ' 个标签 ▾' : '收起标签 ▴';
      }
      function sync() {
        if (mq.matches) { toggle.hidden = false; setClipped(true); }
        else { toggle.hidden = true; setClipped(false); }
      }
      toggle.addEventListener('click', function () { setClipped(!filter.classList.contains('clipped')); });
      if (mq.addEventListener) mq.addEventListener('change', sync);
      else if (mq.addListener) mq.addListener(sync);
      sync();
    }
  })();
</script>`;

fs.writeFileSync(path.join(PUB, 'blog', 'index.html'), listHtml.replace('</body>', listFilter + '\n</body>'), 'utf8');
written.push('blog/index.html');

/* ============================================================
   3. 常见问题 /faq.html
   ============================================================ */
const faqs = JSON.parse(fs.readFileSync(path.join(SRC, 'faqs.json'), 'utf8'));
const faqAnswerHtml = (a) => {
  let html = marked.parseInline(rewriteMarkdownLinks(a, ''));
  return html.replace(/^<p>([\s\S]*)<\/p>$/, '$1');
};

const faqBody = `
<div class="sect" style="padding-top:0">
    ${crumbsHtml([['首页', 'index.html'], ['常见问题 FAQ']])}
    <h1>常见问题 FAQ</h1>
    <p class="lead-in">
      关于号码标记查询、标记清除、号码认证、归属地查询的高频问题。回答里给出的渠道与时效，
      均来自各平台官网公开信息与公开报道；实际操作以平台最新公示为准。
    </p>
    <div class="faq-list">
${faqs
  .map(
    (f, i) => `      <details class="faq-item">
        <summary>${i + 1}. ${escAttr(f.q)}</summary>
        <div class="faq-a">${faqAnswerHtml(f.a)}</div>
      </details>`
  )
  .join('\n')}
    </div>

    <div class="alert alert-info mt3">
      <strong>还有具体问题？</strong>先<a href="tools/marking-check.html">用自查向导查清你的号码被哪几家标了</a>，
      再按<a href="guide/how-to-check.html">自查指南</a>给出的顺序逐家处理。
      按号码类型（手机 / 座机 / 170 等虚商 / 400 / 95）分类的深度文章在<a href="blog/">号码百科</a>。
    </div>

    <p class="xs muted2 mt3 mb0">
      本站不代替任何平台查询标记结果，也不承诺申诉一定通过。所有官方申诉入口均免费；
      遇到声称「加急」「内部渠道」「包过」的付费代办，请直接关闭页面。
    </p>
</div>`;

const faqLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: mdToPlain(f.q),
      acceptedAnswer: { '@type': 'Answer', text: mdToPlain(f.a) },
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '首页', item: `${ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: '常见问题 FAQ', item: `${ORIGIN}/faq.html` },
    ],
  },
];

fs.writeFileSync(
  path.join(PUB, 'faq.html'),
  page({
    p: '',
    title: `常见问题 FAQ：号码被标记怎么解除、清除要多久、是否收费 - ${BRAND}`,
    desc: '号码被标记怎么解除？座机标记怎么清除？清除要多久、要不要收费、为何会复标？号码认证与标记清除有何区别？高频问题一次答清。',
    canonical: `${ORIGIN}/faq.html`,
    ogType: 'website',
    navOn: '',
    keywords: '号码标记清除常见问题,手机号码被标记怎么解除,座机号码标记怎么清除,号码标记清除收费吗,号码认证是什么,号码为何被标记,标记清除后复标',
    crumbs: '',
    body: faqBody,
    ld: faqLd,
  }),
  'utf8'
);
written.push('faq.html');

/* ============================================================
   4. RSS /rss.xml
   ============================================================ */
const rfc822 = (d) => new Date(d + 'T09:00:00+08:00').toUTCString();
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${BRAND} · 号码百科</title>
    <link>${ORIGIN}/blog/</link>
    <description>号码标记查询、标记清除、号码认证与归属地查询的深度文章。</description>
    <language>zh-CN</language>
    <atom:link href="${ORIGIN}/rss.xml" rel="self" type="application/rss+xml" />
${byDateDesc
  .map(
    (s) => `    <item>
      <title>${escAttr(posts[s].title)}</title>
      <link>${ORIGIN}/blog/${s}.html</link>
      <guid isPermaLink="true">${ORIGIN}/blog/${s}.html</guid>
      <pubDate>${rfc822(posts[s].date)}</pubDate>
      <description>${escAttr(posts[s].excerpt)}</description>
${posts[s].tags.map((t) => `      <category>${escAttr(t)}</category>`).join('\n')}
    </item>`
  )
  .join('\n')}
  </channel>
</rss>
`;
fs.writeFileSync(path.join(PUB, 'rss.xml'), rss, 'utf8');
written.push('rss.xml');

/* ============================================================
   5. sitemap.xml（含 blog 与 faq，lastmod 用真实日期）
   ============================================================ */
const staticPages = [
  ['/', '2026-09-15', '1.0', 'daily'],
  ['/blog/', '2026-09-15', '0.9', 'daily'],
  ['/tools/marking-check.html', '2026-09-15', '0.9', 'monthly'],
  ['/tools/marking-clear.html', '2026-09-15', '0.9', 'monthly'],
  ['/tools/legal-number-verify.html', '2026-09-15', '0.8', 'monthly'],
  ['/tools/attribution.html', '2026-09-15', '0.8', 'monthly'],
  ['/guide/how-to-check.html', '2026-09-15', '0.8', 'monthly'],
  ['/faq.html', '2026-09-15', '0.8', 'monthly'],
  ['/about.html', '2026-09-15', '0.5', 'yearly'],
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    ([loc, mod, pri, freq]) => `  <url>
    <loc>${ORIGIN}${loc}</loc>
    <lastmod>${mod}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${pri}</priority>
  </url>`
  )
  .join('\n')}
${byDateDesc
  .map(
    (s) => `  <url>
    <loc>${ORIGIN}/blog/${s}.html</loc>
    <lastmod>${posts[s].updated || posts[s].date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(PUB, 'sitemap.xml'), sitemap, 'utf8');
written.push('sitemap.xml');

console.log('WROTE ' + written.length + ' files:');
written.forEach((w) => console.log('  ' + w));
console.log('\nposts: ' + slugs.length + ' | tags: ' + allTags.length + ' | faq items: ' + faqs.length);
