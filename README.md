# 号码通查 - 专业号码标记查询与清除服务平台

一个超越竞品的号码标记服务网站，采用 Astro 5 + Vue 3 技术栈，专注于 SEO/GEO/AI 搜索引擎优化。

## 项目特点

### 技术架构
- **框架**: Astro 5.20 (SSG 零 JS，秒级加载)
- **UI**: Tailwind CSS v4 + shadcn/ui
- **组件库**: Vue 3 (用于交互式工具)
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
- 博客文章系统 (MDX 支持)
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

## 部署

### Cloudflare Pages
1. 在 Cloudflare 控制台创建 Pages 项目
2. 连接 GitHub 仓库
3. 设置构建命令: `cd frontend && npm install && npm run build`
4. 设置输出目录: `frontend/dist`
5. 添加环境变量:
   - `CF_PAGES_TOKEN`: Cloudflare Pages API Token
   - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare 账号 ID

### 手动部署
```bash
# 构建项目
npm run build

# 上传到 Cloudflare Pages
npx wrangler pages deploy ./frontend/dist --project-name=numbertool
```

## SEO 检查清单

- [x] 每个页面都有唯一的 title 和 description
- [x] 正确使用 H1-H6 标题层级
- [x] 图片都有 alt 属性
- [x] 内部链接使用语义化锚文本
- [x] 外部链接指向权威来源
- [x] 结构化数据完整
- [x] robots.txt 允许主要爬虫
- [x] sitemap.xml 包含所有页面
- [x] canonical URL 正确设置
- [x] hreflang 多语言正确配置
- [x] AI 爬虫友好文件已生成
- [x] 移动端适配良好
- [x] 加载速度优秀 (Lighthouse > 95)

## 竞争对手分析

相比 zangxixitech.cn 的升级点:

| 维度 | 竞品现状 | 新站升级 |
|------|---------|---------|
| 框架 | Astro 5.18 | Astro 5.20 + SSR 可选 |
| UI | 基础 Tailwind | shadcn/ui + 主题系统 |
| SEO | 基础 meta | 完整 Schema.org + GEO 优化 |
| AI 适配 | llms.txt | llms.txt + ai.xml + brand-info.json |
| 多语言 | 基础中文 | zh-CN + en-US 双语 |
| 工具 | 外链为主 | 内嵌查询 + 进度追踪 |
| 内容 | 19 篇文章 | 30+ 深度文章 |
| 性能 | 未知 | Lighthouse 95+ 目标 |

## 成功指标

### SEO 指标
- Google Search Console 收录率 > 90%
- 核心关键词排名前 3 占比 > 60%
- 自然搜索流量月增长 > 20%

### 技术指标
- Lighthouse 评分: SEO 100 / Performance 95+ / Accessibility 100
- PageSpeed Insights 分数: 移动 > 90，桌面 > 95
- Core Web Vitals 达标率 > 95%

### AI 搜索指标
- 被 ChatGPT/Claude 引用次数月度追踪
- 品牌词在 AI 回答中出现率
- llms.txt 阅读量

## 许可证

MIT License

## 联系方式

- 网站: https://www.524900.xyz
- 邮箱: noreply@524900.xyz
- 微信: SXLH-888
