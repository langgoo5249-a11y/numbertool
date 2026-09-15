# 号通查 · 524900.xyz

独立的第三方号码工具站。把分散在各家官网的号码标记自查入口、申诉材料要求与归属地查询，
做成站内可直接使用的工具。

**线上地址**：https://524900.xyz

## 站点内容

| 页面 | 路径 | 说明 |
|---|---|---|
| 首页 | `/` | 站点定位、工具入口、做什么与不做什么 |
| 号码标记自查向导 | `/tools/marking-check.html` | 按号码类型生成待查平台清单，记录结果后输出标记诊断卡 |
| 申诉材料生成器 | `/tools/marking-clear.html` | 生成可复制的申诉说明文本 + 个人 4 项 / 企业 5 项材料清单 + 驳回自查 |
| 法人号码核验预检 | `/tools/legal-number-verify.html` | 手机号号段、身份证号校验位（GB 11643）、姓名与企业全称格式预检 |
| 归属地查询 | `/tools/attribution.html` | 运营商 / 省份 / 城市 / 区号 / 邮编，支持批量 20 个 |
| 号码标记自查指南 | `/guide/how-to-check.html` | 标记从哪来、为什么清了又回来、查出来先处理哪一个 |
| 号码百科（文章列表） | `/blog/` | 16 篇文章的索引，支持按标签筛选 |
| 号码百科（文章页） | `/blog/<slug>.html` | 按号码类型与场景的深度文章，多数附问答区块 |
| 常见问题 FAQ | `/faq.html` | 10 个高频问题的问答，含 FAQPage 结构化数据 |
| 关于本站 | `/about.html` | 数据来源、隐私边界与免责声明 |

站点同时输出 `rss.xml`（号码百科订阅）与 `sitemap.xml`（25 个地址）。

## 号码百科内容维护

文章不是手写 HTML，而是从数据生成后**把产物提交进仓库**——这样线上构建保持零依赖。

- 文章正文与元数据：`blog-src/posts.json`（16 篇；`content` 字段为 Markdown）
- 常见问题：`blog-src/faqs.json`
- 生成器：`scripts/build-blog.mjs`（本地一次性运行，不参与线上构建）

```bash
npm i -D marked       # 仅首次：只有本地重新生成文章时才需要 marked
npm run blog          # 重新生成文章页 / FAQ / RSS / sitemap
```

**注意**：`npm run blog` 会重写 `public/blog/**`、`public/faq.html`、`public/rss.xml`
与 `public/sitemap.xml`，手改这些文件会在下次生成时被覆盖。要改文章内容请改 `blog-src/*.json`。

新增一篇文章：在 `posts.json` 里加一个 key（即 slug），补 `title/date/excerpt/tags/content`，
再跑一次 `npm run blog` 即可；sitemap 与 RSS 会自动带上。

## 技术结构

纯静态站点，**零运行时依赖**，不需要 npm install。

```
├── public/                    # 站点源文件（直接对应线上目录结构）
│   ├── index.html  about.html  faq.html  404.html
│   ├── tools/                 # 4 个工具页
│   ├── guide/                 # 内容页
│   ├── blog/                  # 号码百科列表页 + 16 篇文章页（由 blog-src 生成）
│   ├── assets/                # style.css / app.js / data.js / prefix-table.js
│   ├── _headers               # Cloudflare Pages 响应头（含 AI 爬虫放行声明）
│   ├── _redirects             # 旧站 URL → 新站 URL 的 301 规则
│   ├── robots.txt  sitemap.xml  llms.txt  llms-full.txt  ai.xml  brand-info.json
│   ├── rss.xml                # 号码百科订阅（由 blog-src 生成）
│   └── og-default.png  favicon*  # 构建时生成，不入库
├── blog-src/                  # 文章与问答的数据源（唯一真源）
│   ├── posts.json             # 16 篇文章（Markdown 正文 + 元数据）
│   └── faqs.json              # 常见问题问答
├── functions/api/attribution.js   # 归属地查询 Pages Function
├── scripts/
│   ├── build-blog.mjs         # 由 blog-src 生成文章页 / FAQ / RSS / sitemap（仅本地）
│   ├── verify-build.py        # 构建产物校验：死链 / SEO 头 / JSON-LD / 残留（需 Python 3）
│   ├── generate-og.mjs        # 构建时用 zlib 手写 PNG 编码，生成 1200×630 分享图
│   ├── generate-favicon.mjs   # 构建时生成 favicon 套件（含多尺寸 ICO）
│   └── serve.mjs              # 本地开发服务器（会把 /api/* 交给真实 Function）
├── build.mjs                  # public/ → dist/
├── wrangler.toml
└── .github/workflows/deploy.yml
```

图片资源用 Node 内置 `zlib` 手写 PNG 编码器生成，不引入 sharp / canvas 等原生依赖，
因此在任何 Node ≥ 18 的构建环境里都能跑。

## 本地开发

```bash
# 构建 + 启动本地服务（默认 http://127.0.0.1:4321）
npm run dev

# 只构建
npm run build

# 只重新生成图片资源
npm run assets

# 校验构建产物（死链 / SEO 头 / JSON-LD / 品牌残留 / 硬规定链接）
npm run verify
```

`npm run dev` 会把 `/api/*` 交给 `functions/` 下的真实 Pages Function 处理，
本地验证的就是线上要跑的那份代码，不是 mock。

`npm run verify` 需要 Python 3，读取 `public/` 而非 `dist/`。

## 部署

Cloudflare Pages 项目 `numbertool`，构建配置：

- Build command：`npm run build`
- Output directory：`dist`

推送到 `main` 分支即可自动部署。也可用 `.github/workflows/deploy.yml` 走
GitHub Actions + wrangler 部署（需要仓库 Secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`）。

可选环境变量 `LOOKUP_API_KEY`（聚合数据）：配置后归属地接口会优先使用该数据源，
返回信息更全；不配置则走 360 免费接口，再不行降级到本地号段库。

## 注意事项

**域名与 canonical**：站点的 canonical / og:url / sitemap 全部指向 `https://524900.xyz`。
裸域 `524900.xyz` 在 Cloudflare 边缘有 308 跳转到 www，所以带 www 的版本才是实际提供服务的地址，
canonical 必须与之一致，否则会被搜索引擎忽略。若要改用裸域，需先在 Cloudflare 移除该跳转规则，
再同步修改 `scripts/build-blog.mjs`（常量 `ORIGIN`）与各页面头部、`_headers`、`robots.txt` 中的地址。

**旧 URL 跳转**：`public/_redirects` 把上一版站点（部署在 `/zh-CN/` 路径下）的地址 301 到新站对应页面。
其中博客用 `:slug` 占位符逐篇对应到 `/blog/<slug>.html`，避免旧文章的长尾收录被统一打到首页。
修改站点结构时请一并维护这份规则。

**第三方合作入口**：三个工具页的 `xbh5.open10086.com` 入口为合作方指定链接，
链接与参数不得修改、替换或移除。
