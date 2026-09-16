# -*- coding: utf-8 -*-
"""
号通查 — 全站构建产物校验（含新增的号码百科 / 常见问题）
  1. 内部链接可达性（相对链接、根绝对链接、目录 index 解析）
  2. 每页 SEO 头（title/description/canonical/og）完备且自洽
  3. 结构化数据 JSON-LD 可解析
  4. 每页恰好 1 个 h1
  5. 品牌残留、旧路径残留、占位符残留
  6. 硬规定链接（合作方服务入口）未被改动
  7. 站点级文件齐备
"""
import os, re, json, io, sys
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, 'public')
ORIGIN = 'https://www.524900.xyz'

HARD_LINKS = [
    'https://xbh5.open10086.com/?authorization=f91029a83a8758aa',
    'https://xbh5.open10086.com/factor/?authorization=f91029a83a8758aa#/pages/index/index',
]

ok = []
fail = []
warn = []


def check(cond, msg):
    (ok if cond else fail).append(msg)
    return cond


def read(p):
    return io.open(p, encoding='utf-8').read()


# ---------------------------------------------------------------- 收集页面
pages = []
for root, dirs, files in os.walk(PUB):
    dirs[:] = [d for d in dirs if d not in ('.git', 'node_modules')]
    for f in files:
        if f.endswith('.html'):
            pages.append(os.path.join(root, f))
pages.sort()
print(f'HTML pages: {len(pages)}\n')

rel_pages = [os.path.relpath(p, PUB).replace('\\', '/') for p in pages]

# ---------------------------------------------------------------- 1. 链接可达性
def resolve(page_rel, href):
    """把 href 解析成 public 下的相对路径；返回 (kind, path)"""
    href = href.split('#')[0].split('?')[0]
    if not href:
        return ('skip', '')
    if href.startswith('/'):
        target = href.lstrip('/')
    else:
        base = os.path.dirname(page_rel)
        # 末段为空（以 / 结尾）时直接拼 index.html，避免 normpath 吃掉斜杠
        if href.endswith('/'):
            target = os.path.normpath(os.path.join(base, href)).replace('\\', '/') + '/'
        else:
            target = os.path.normpath(os.path.join(base, href)).replace('\\', '/')
    if target.endswith('/') or target == '':
        return ('dir', (target.lstrip('/') + 'index.html') or 'index.html')
    return ('file', target)


broken = []
for p in pages:
    page_rel = os.path.relpath(p, PUB).replace('\\', '/')
    s = read(p)
    # <script> 内联代码里会有 'a href="' + x + '"' 这类字符串拼接，会污染链接扫描：
    # 先单独取出真正的 <script src="...">，再把 script 块整体剔除
    script_srcs = [m for m in re.findall(r'<script[^>]+src="([^"]+)"', s)]
    s_scan = re.sub(r'<script[\s\S]*?</script>', '', s)
    attrs = re.findall(r'(?:href|src)="([^"]+)"', s_scan) + script_srcs
    for h in attrs:
        if re.match(r'^(https?:|mailto:|tel:|data:|#|javascript:)', h):
            continue
        kind, target = resolve(page_rel, h)
        if kind == 'skip':
            continue
        full = os.path.join(PUB, target.replace('/', os.sep))
        if not os.path.isfile(full):
            broken.append((page_rel, h, target))

check(not broken, f'内部链接全部可达（{len(pages)} 页，0 死链）')
for pg, h, t in broken[:40]:
    fail.append(f'    死链 {pg}: {h}  ->  {t}')

# ---------------------------------------------------------------- 2. SEO 头
for p in pages:
    rel = os.path.relpath(p, PUB).replace('\\', '/')
    s = read(p)
    is404 = rel == '404.html'
    title = re.search(r'<title>(.*?)</title>', s, re.S)
    desc = re.search(r'<meta name="description" content="([^"]*)"', s)
    canon = re.search(r'<link rel="canonical" href="([^"]+)"', s)
    ogurl = re.search(r'<meta property="og:url" content="([^"]+)"', s)
    ogimg = re.search(r'<meta property="og:image" content="([^"]+)"', s)

    if not is404:
        check(bool(title and title.group(1).strip()), f'{rel}: title 非空')
        check(bool(desc and desc.group(1).strip()), f'{rel}: description 非空')
        check(bool(canon), f'{rel}: canonical 存在')
        check(bool(ogurl), f'{rel}: og:url 存在')
        check(bool(ogimg), f'{rel}: og:image 存在')
        if canon and ogurl:
            check(canon.group(1) == ogurl.group(1), f'{rel}: canonical == og:url')
        if canon:
            c = canon.group(1)
            check(c.startswith(ORIGIN), f'{rel}: canonical 用 www 主域')
            # canonical 指向的文件必须真实存在
            path = c[len(ORIGIN):]
            if path.endswith('/') or path == '':
                fp = os.path.join(PUB, (path + 'index.html').lstrip('/').replace('/', os.sep))
            else:
                fp = os.path.join(PUB, path.lstrip('/').replace('/', os.sep))
            check(os.path.isfile(fp), f'{rel}: canonical 目标文件存在')
    check(bool(re.search(r'<meta name="robots"', s)), f'{rel}: robots meta 存在')

# ---------------------------------------------------------------- 3. JSON-LD
ld_total = 0
for p in pages:
    rel = os.path.relpath(p, PUB).replace('\\', '/')
    s = read(p)
    blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S)
    check(rel == '404.html' or len(blocks) >= 1, f'{rel}: 至少 1 段 JSON-LD（{len(blocks)}）')
    for i, b in enumerate(blocks):
        ld_total += 1
        try:
            d = json.loads(b)
            check(isinstance(d, dict) and '@context' in d and '@type' in d,
                  f'{rel}: JSON-LD[{i}] 含 @context/@type')
        except Exception as e:
            fail.append(f'  JSON-LD 解析失败 {rel}[{i}]: {e}')
check(ld_total > 0, f'JSON-LD 总段数 {ld_total}')

# ---------------------------------------------------------------- 4. h1
for p in pages:
    rel = os.path.relpath(p, PUB).replace('\\', '/')
    n = len(re.findall(r'<h1[\s>]', read(p)))
    check(n == 1, f'{rel}: 恰好 1 个 h1（{n}）')

# ---------------------------------------------------------------- 5. 残留
RESIDUE = {
    '旧品牌 号码标记清除网': '号码标记清除网',
    '旧路径 /zh-CN/': '/zh-CN/',
    '预览站字样': '预览站',
    '功能内化字样': '功能内化',
    '旧域 zangxixitech': 'zangxixitech',
    '旧域 skillxm': 'skillxm',
    'TODO 占位': 'TODO',
    'lorem 占位': 'lorem',
}
for label, needle in RESIDUE.items():
    hits = []
    for p in pages:
        rel = os.path.relpath(p, PUB).replace('\\', '/')
        if needle in read(p):
            hits.append(rel)
    check(not hits, f'无残留「{label}」' + (f' — 命中: {hits}' if hits else ''))

# ---------------------------------------------------------------- 6. 硬规定链接
allfiles = {}
for p in pages:
    allfiles[os.path.relpath(p, PUB).replace('\\', '/')] = read(p)
for need in HARD_LINKS:
    found = [k for k, v in allfiles.items() if need.split('?')[0] in v and 'authorization=f91029a83a8758aa' in v]
    check(bool(found), f'硬规定合作入口存在: {need[:52]}… ({len(found)} 页)')

cols = read(os.path.join(PUB, 'assets', 'data.js'))
for need in HARD_LINKS:
    check(need in cols, f'data.js 中硬规定链接原样保留: {need[:52]}…')

# ---------------------------------------------------------------- 7. 站点级文件
SITE_FILES = ['robots.txt', 'sitemap.xml', 'llms.txt', 'llms-full.txt', 'ai.xml',
              'brand-info.json', 'rss.xml', '_redirects', '_headers',
              'favicon.svg', 'favicon.ico', 'og-default.png', '404.html',
              'index.html', 'about.html', 'faq.html', 'blog/index.html']
for f in SITE_FILES:
    check(os.path.isfile(os.path.join(PUB, f.replace('/', os.sep))), f'站点文件存在: {f}')

# sitemap 里每个 URL 都要能落到文件
sm = read(os.path.join(PUB, 'sitemap.xml'))
locs = re.findall(r'<loc>([^<]+)</loc>', sm)
check(len(locs) == 26, f'sitemap URL 数 = 26（实际 {len(locs)}）')
for u in locs:
    path = u[len(ORIGIN):]
    if path.endswith('/') or path == '':
        fp = os.path.join(PUB, (path + 'index.html').lstrip('/').replace('/', os.sep))
    else:
        fp = os.path.join(PUB, path.lstrip('/').replace('/', os.sep))
    check(os.path.isfile(fp), f'sitemap 目标存在: {path or "/"}')

# rss 里每条 link 都要能落到文件
rss = read(os.path.join(PUB, 'rss.xml'))
items_xml = re.findall(r'<item>(.*?)</item>', rss, re.S)
blog_items = [re.search(r'<link>([^<]+)</link>', it).group(1) for it in items_xml]
check(len(blog_items) == 17, f'rss 文章条数 = 17（实际 {len(blog_items)}）')
for u in blog_items:
    fp = os.path.join(PUB, u[len(ORIGIN):].lstrip('/').replace('/', os.sep))
    check(os.path.isfile(fp), f'rss 目标存在: {u[len(ORIGIN):]}')

# ---------------------------------------------------------------- 汇总
print('=' * 62)
print(f'通过 {len(ok)} 项')
if fail:
    print(f'\n❌ 失败/问题 {len(fail)} 项：')
    for f in fail:
        print('  - ' + f)
else:
    print('✅ 0 项失败')
print('=' * 62)
sys.exit(1 if fail else 0)
