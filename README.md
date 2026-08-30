# 号码通查 - 专业号码标记查询与清除服务平台

一个超越竞品的号码标记服务网站，采用 Astro 4 + Vue 3 技术栈，专注于 SEO/GEO/AI 搜索引擎优化。

## 项目特点

### 技术架构
- **框架**: Astro 4.16 (SSG 零 JS，秒级加载)
- **UI**: Tailwind CSS v4
- **组件库**: Vue 3
- **部署**: Cloudflare Pages (全球 CDN)

### SEO/GEO 优化
- ✅ 完整的 Schema.org 结构化数据 (Organization, Article, FAQ, HowTo)
- ✅ 精细化的 robots.txt (AI 爬虫白名单机制)
- ✅ llms.txt / llms-full.txt / ai.xml (AI 搜索引擎友好文件)
- ✅ brand-info.json (品牌信息 JSON-LD)
- ✅ 动态 sitemap.xml + rss.xml
- ✅ hreflang 多语言支持 (zh-CN / en-US)
- ✅ Open Graph + Twitter Cards 完整实现
- ✅ Canonical URL 防重复内容

### 核心功能
1. **号码标记自查** - 多平台标记状态聚合查询
2. **号码标记清除** - 官方申诉入口导航
3. **号码归属地查询** - 支持携号转网后查询
4. **法人号码核验** - 三要素实名认证
5. **手机卡选号比价** - 套餐对比与选号指南

### 内容策略
- 博客文章系统
- 指南教程系统
- 对比评测系统
- 常见问题 (FAQ) 系统
- 长尾关键词矩阵覆盖

## 项目结构

```
numbertool-frontend/
├── src/
│   ├── components/
│   │   ├── layout/        # 布局组件
│   │   └── seo/           # SEO 组件
│   ├── layouts/           # 布局模板
│   ├── lib/               # 工具函数
│   ├── pages/             # Astro 页面
│   └── styles/            # 全局样式
├── public/                # 静态资源
│   ├── robots.txt         # 精细化爬虫规则
│   ├── llms.txt           # AI 模型入口文件
│   ├── llms-full.txt      # AI 完整内容摘要
│   ├── ai.xml             # AI 爬虫引导文件
│   └── brand-info.json    # 品牌结构化数据
├── astro.config.mjs       # Astro 配置
├── package.json           # 依赖配置
└── wrangler.toml          # Cloudflare Pages 配置
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 部署到 Cloudflare Pages

### 方式一：GitHub Actions (推荐)

1. 在 Cloudflare Dashboard 创建 Pages 项目：
   - 访问 https://dash.cloudflare.com/pages
   - 点击 "Create a project" → "Connect to Git"
   - 选择仓库 `langgoo5249-a11y/numbertool`
   - 设置构建参数：
     - Build command: `npm run build`
     - Output directory: `dist`
     - Build directory: 留空
   - 点击 "Save and Deploy"

2. 添加环境变量（在 Cloudflare Dashboard → Project Settings → Environment Variables）：
   - `NODE_ENV`: `production`

3. CI/CD 会自动在每次推送到 main 分支时触发部署

### 方式二：Wrangler CLI

```bash
# 登录 Cloudflare
npx wrangler login

# 创建 Pages 项目
npx wrangler pages project create numbertool

# 部署
npx wrangler pages deploy ./dist --project-name=numbertool --branch=main
```

### 方式三：手动上传

```bash
# 构建项目
npm run build

# 压缩 dist 目录
cd dist && zip -r ../numbertool.zip . && cd ..

# 在 Cloudflare Dashboard 上传
# https://dash.cloudflare.com/pages → Manage Depot → Upload
```

## 绑定自定义域名

1. 在 Cloudflare Dashboard → Pages 项目 → Custom Domains
2. 添加域名 `www.524900.xyz`
3. 按照提示配置 DNS CNAME 记录：
   ```
   www  CNAME  <project-name>.pages.dev
   ```

## 竞争对手分析

相比 zangxixitech.cn 的升级点：

| 维度 | 竞品现状 | 新站升级 |
|------|---------|---------|
| 框架 | Astro 5.18 | Astro 4.16 + 路径别名 |
| UI | 基础 Tailwind | Tailwind CSS v4 |
| SEO | 基础 meta | 完整 Schema.org + GEO 优化 |
| AI 适配 | llms.txt | llms.txt + ai.xml + brand-info.json |
| 多语言 | 基础中文 | zh-CN + en-US 双语 |
| 工具 | 外链为主 | 内嵌查询 + 进度追踪 |
| 内容 | 19 篇文章 | 10+ 深度文章 + 可扩展 |
| 性能 | 未知 | Lighthouse 95+ 目标 |

## 成功指标

### SEO 指标
- Google Search Console 收录率 > 90%
- 核心关键词排名前 3 占比 > 60%
- 自然搜索流量月增长 > 20%

### 技术指标
- Lighthouse 评分：SEO 100 / Performance 95+ / Accessibility 100
- PageSpeed Insights 分数：移动 > 90，桌面 > 95
- Core Web Vitals 达标率 > 95%

### AI 搜索指标
- 被 ChatGPT/Claude 引用次数月度追踪
- 品牌词在 AI 回答中出现率
- llms.txt 阅读量

## 后续优化建议

1. **增加更多博客文章**：达到 30+ 篇文章覆盖更多长尾关键词
2. **添加英文页面**：完善 en-US 本地化内容
3. **实现交互式工具**：添加真实的号码标记查询 API 集成
4. **生成 OG 图片**：使用 sharp 或 similar 工具生成动态 OpenGraph 图片
5. **添加 analytics**：集成 Google Analytics 或 Cloudflare Analytics
6. **SEO 审计**：使用 Screaming Frog 进行全站 SEO 审计
7. **性能优化**：运行 Lighthouse CI 确保性能达标

## 许可证

MIT License

## 联系方式

- 网站: https://www.524900.xyz
- 邮箱: noreply@524900.xyz
- GitHub: https://github.com/langgoo5249-a11y/numbertool
