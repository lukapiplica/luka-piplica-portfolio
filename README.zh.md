# Luka Piplica — 个人主页与技术博客

<p align="left">
  <a href="./README.md">🇺🇸 English</a> │
  <a href="./README.hr.md">🇭🇷 Hrvatski</a> │
  <a href="./README.es.md">🇪🇸 Español</a> │
  <a href="./README.de.md">🇩🇪 Deutsch</a> │
  <a href="./README.ja.md">🇯🇵 日本語</a> │
  <a href="./README.zh.md">🇨🇳 中文</a>
</p>

一个基于 Astro、TypeScript 和 Tailwind CSS 构建的高性能、完全本地化的个人作品集与技术知识库。内容涵盖企业级 IT 运维、网络基础设施、硬件诊断以及系统加固（Systems Hardening）。

本项目基于 Astro Rocket 主题开发，但对其路由引擎、i18n（国际化）系统、搜索层和内容流水线（Content Pipelines）进行了完全重构。

---

## 🛠️ 技术栈 (Tech Stack)

| 架构层 | 技术选型 | 备注 |
| :--- | :--- | :--- |
| **框架** | Astro | 结合 Content Collections 的 SSG（静态网站生成） |
| **样式** | Tailwind CSS | 语义化设计令牌（Semantic design tokens） |
| **语言** | TypeScript | 覆盖所有内容集合的严格 Schema 校验 |
| **结构化数据** | Schema.org / `schema-dts` | JSON-LD 集成 |

---

## 🚀 我重构与拓展的功能

原生主题仅提供了基础的布局组件和简易路由。以下所有功能均为在此基础上从零设计并实现的。

### 1. 完整的 i18n 国际化系统 — 6 种语言，覆盖所有路由
原主题虽然包含占位用的 i18n 钩子（Hooks），但缺乏实际的翻译数据、针对 `/blog` 的语言前缀路由，以及系统化处理动态字符串的方法。

* **路由重构:** 遵循现有的 `/projects` 模式，为 `/blog` 和 `/[...slug]` 增加了带语言前缀的路由 — 创建了 `[locale]/blog/index.astro`、`[locale]/blog/[...slug].astro` 以及复用的 `BlogContent.astro` 组件。
* **本地化覆盖:** 为所有 6 个语言文件（`en`、`hr`、`de`、`es`、`ja`、`zh`）填充了每个 UI 字符串的翻译键值：文章元数据（分享标签、阅读时间、“本页导航”、日期）、导航标签、搜索文本以及主题控制（模式、颜色、系统/浅色/深色标签）。
* **区域感知格式化:** 通过 `Intl.DateTimeFormat` 实现了语言自适应的日期格式化，确保日期在每种语言下都能正确渲染（例如：中文显示为 *2026年6月2日*）。
* **动态字符串插值:** 在组件内部构建了基于正则表达式（Regex）的字符串插值功能，用于处理上下文模板字符串，例如 `发布于 {date}` 或 `未找到与 "{query}" 相关的结果`。
* **下拉菜单本地化:** 完全本地化了 `ThemeModeDropdown`、`ThemeSelectorDropdown` 和 `ThemeSelector` — 包括颜色名称和模式标签。

> **支持的语言:** 英语（默认，无前缀）· 克罗地亚语 `/hr` · 德语 `/de` · 西班牙语 `/es` · 日语 `/ja` · 中文 `/zh`

### 2. 确定性的语言自适应链接路由
原系统存在一个 Bug：在英语版博客文章中点击项目链接时，会被错误地重定向到 `/zh/projects/...`，而不是正确的无前缀路由 `/projects/...`。

**根本原因 — 两个问题链式反应:**
1. `BaseLayout.astro` 中的语言追踪脚本在访问 `/`、`/projects`、`/about` 和 `/contact` 时，会将存储的语言重置为 `en` — 但偏偏漏掉了 `/blog`。这导致用户在访问某个本地化页面后切换到 `/blog/some-post` 时，`localStorage` 中仍残留着旧的语言缓存。
2. `BlogLayout.astro` 中的链接重写器（Link Rewriter）直接从 `localStorage` 和 `navigator.language` 中读取目标语言，而不是获取 Astro 服务端渲染的当前页面语言 — 导致链接重写完全依赖于随机留存的缓存。

**解决方案:**
* 在 `BaseLayout.astro` 的首选语言重置条件中补充了 `/blog` 路由。
* 使用 `define:vars={{ pageLocale: locale }}` 重写了链接重写器，将 Astro 服务端渲染的语言直接传递给客户端内联脚本 — 从而使路由逻辑完全确定化，不再受浏览器缓存状态的影响。
* 相同的修复也应用到了 `ProjectLayout.astro` 中，用以解决项目页面内部跨链接的重定向问题。

```diff
- <script is:inline>
+ <script is:inline define:vars={{ pageLocale: locale }}>
    (function () {
      try {
-       const locales = ['en', 'de', 'ja', 'es', 'zh', 'hr'];
-       let preferredLocale = localStorage.getItem('preferred-locale');
-       if (!preferredLocale) {
-         const browserLang = navigator.language.split('-')[0];
-         preferredLocale = locales.includes(browserLang) ? browserLang : null;
-       }
-       if (preferredLocale && preferredLocale !== 'en') {
+       if (pageLocale && pageLocale !== 'en') {
          // 将 /projects/... 链接重写为 /{locale}/projects/...
        }
      } catch {}
    })();
  </script>
```

正如 `astro.config.mjs` 中配置的 `prefixDefaultLocale: false` 一样，英语路由保持无前缀状态。

---

### 3. 无后端端点（Zero-endpoint）的命令面板搜索
原主题不具备搜索功能。我在不依赖任何后端接口或第三方搜索库的情况下，实现了一个完整的命令面板搜索功能。

**工作原理：**
* **构建时静态索引化:** 在项目构建时，Astro 的编译期抓取器会同时查询 `blog` 和 `projects` 内容集合，并将结果序列化为一个内联的 JSON 数组，直接嵌入到 `SearchModal.astro` 内部。因此运行时无需发送 HTTP 请求，也不依赖外部 API。
* **路由映射:** 索引生成器会自动剥离内容 ID 中的语言前缀，从而确保每个条目都能精确映射到对应的区域感知路由。
* **模糊匹配:** 客户端模糊匹配算法通过实时注入 `<mark>` 标签，高亮显示匹配到的子字符串。
* **全键盘交互:** 完全支持键盘驱动：`⌘K` 或 `/` 唤起面板 · `Esc` 关闭面板 · `↑`/`↓` 上下选择 · `Enter` 确认跳转。

*搜索按钮已集成至导航栏中，在所有语言版本的每个页面上均可使用。*

---

### 4. 自动化阅读时间计算流水线
每篇博客文章都会显示计算出的预估阅读时间。该流水线在编译期于文章布局（Layout）内部运行：
* 剔除原始内容树中的 MDX/HTML 标记，以提取出纯文本。
* 以 200 WPM（每分钟字数）为基准计算阅读时间。
* 如果正文内容不可用，则回退并根据文章的元描述（Meta Description）字数进行估算。
* 通过当前激活的 i18n 包装器输出本地化字符串（例如：`3 分钟阅读` / `3 min read`）。

---

### 5. 首页内容去重机制
由于内容存储在各个语言专属的 MDX 文件中（例如 `blog/en/post.mdx`、`blog/de/post.mdx` 等），导致首页“最新文章”区域会多次显示同一篇文章 — 即每个语言版本都会按发布日期排序并重复出现。

**解决方案:** 首页的内容查询现在会加入过滤条件，在筛选出最新的 3 篇文章和 4 个项目之前，**仅检索 `en` 集合中的条目**。这确保了无论有多少个语言版本的翻译文件，每篇内容在首页上都只会精准出现一次。

---

## 📁 项目结构

```
src/
├── components/
│   ├── blog/
│   │   ├── ArticleHero.astro
│   │   ├── BlogCard.astro
│   │   ├── Comments.astro
│   │   ├── RelatedPosts.astro
│   │   ├── ShareButtons.astro         # 已本地化的“分享至：”标签
│   │   └── TableOfContents.astro      # 已本地化的“本页导航”目录标题
│   ├── effects/
│   │   ├── CursorTrail.astro
│   │   └── LetterGlitch.tsx
│   ├── layout/
│   │   ├── Header.astro               # 搜索按钮（桌面端 + 移动端）
│   │   ├── LanguageSwitcher.astro
│   │   ├── ThemeModeDropdown.astro    # 已本地化的模式标签（系统/浅色/深色）
│   │   ├── ThemeSelector.astro        # 已本地化的颜色名称
│   │   └── ThemeSelectorDropdown.astro
│   ├── patterns/
│   │   ├── BlogContent.astro          # 公共博客列表组件
│   │   ├── HomeContent.astro          # 包含语言过滤内容的首页组件
│   │   └── ProjectsContent.astro
│   ├── projects/
│   │   ├── ProjectGallery.astro
│   │   ├── ProjectHero.astro
│   │   └── ProjectShowcase.astro
│   ├── search/
│   │   └── SearchModal.astro          # 命令面板 + 构建时内联索引
│   └── seo/
│       ├── Breadcrumbs.astro
│       ├── JsonLd.astro
│       └── SEO.astro
├── config/
│   ├── i18n.config.ts
│   ├── nav.config.ts
│   └── site.config.ts
├── content/
│   ├── blog/
│   │   ├── en/                        # 英文文章（Source of truth / 唯一事实来源）
│   │   ├── hr/                        # 克罗地亚语翻译
│   │   ├── de/                        # 德语翻译
│   │   ├── es/                        # 西班牙语翻译
│   │   ├── ja/                        # 日语翻译
│   │   └── zh/                        # 中文翻译
│   └── projects/
│       ├── en/                        # 英文项目（Source of truth / 唯一事实来源）
│       ├── hr/ de/ es/ ja/ zh/        # 区域翻译变体
│       └── ...
├── i18n/
│   ├── index.ts                       # t(), localizedPath() 等辅助函数
│   ├── en.json
│   ├── hr.json
│   ├── de.json
│   ├── es.json
│   ├── ja.json
│   └── zh.json
├── layouts/
│   ├── BaseLayout.astro               # 全局语言追踪 + 首选语言控制脚本
│   ├── BlogLayout.astro               # 确定性的语言自适应链接重写器
│   ├── PageLayout.astro
│   └── ProjectLayout.astro            # 应用了相同的链接重写器
├── lib/
│   └── utils.ts                       # 支持 Intl.DateTimeFormat 语言本地化的 formatDate() 函数
├── pages/
│   ├── index.astro                    # 首页（i18n + 仅限英文的内容过滤器）
│   ├── about.astro
│   ├── contact.astro
│   ├── blog/
│   │   ├── index.astro                # 英文博客列表（轻量包装层）
│   │   └── [...slug].astro
│   ├── projects/
│   │   ├── index.astro
│   │   └── [slug].astro
│   ├── [locale]/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   ├── blog/
│   │   │   ├── index.astro            # 带语言前缀的博客列表
│   │   │   └── [...slug].astro
│   │   └── projects/
│   │       ├── index.astro
│   │       └── [slug].astro
│   ├── api/
│   │   ├── contact.ts
│   │   └── newsletter.ts
│   ├── rss.xml.ts
│   └── search-index.json.ts
├── styles/
│   ├── global.css
│   ├── themes/                        # 13 种主题颜色（琥珀金、科技蓝、青翠绿等）
│   └── tokens/
│       ├── colors.css
│       ├── primitives.css
│       └── typography.css
└── __tests__/
    ├── contact.test.ts
    ├── i18n.test.ts
    └── newsletter.test.ts
```

---

## ⚙️ 快速入门

**前提条件：** Node.js 和 pnpm

```bash
git clone https://github.com/lukapiplica/luka-piplica-portfolio
cd luka-piplica-portfolio
pnpm install
```

```bash
pnpm run dev    # 启动支持热重载（Hot Reload）的开发服务器
pnpm run build  # 构建生产环境版本
```

---

## 📁 本地化示例

翻译字典文件存放在 `src/i18n/*.json` 路径下。组件内部通过 `t()` 辅助函数对其进行调用：

```astro
---
import { t } from '@/i18n';
const { locale } = Astro.props;
const typingWords = t('aboutPage.typingWords', locale).split(',');
---

<PageLayout title={t('aboutPage.title', locale)} locale={locale}>
  <Hero>
    <h1 slot="title">
      {t('aboutPage.hero.titleLine1', locale)}
      <TypingEffect words={typingWords} />
    </h1>
  </Hero>
</PageLayout>
```

字典键值（Dictionary keys）支持动态字符串的插值功能：

```json
{
  "search": {
    "placeholder": "搜索博客与项目...",
    "noResults": "未找到与 \"{query}\" 相关的结果",
    "shortcutHint": "按 Esc 关闭"
  },
  "blog": {
    "publishedOn": "发布于 {date}",
    "minRead": "分钟阅读",
    "onThisPage": "本页导航"
  }
}
```

---

## 👥 致谢与鸣谢 

本项目基于由 [hansmartensdev](https://github.com/hansmartensdev/Astro-Rocket) 开发的 [Astro Rocket](https://astro.build/themes/details/astro-rocket/) 主题构建。原主题奠定了本项目视觉设计系统与底层组件的基础 — 而本 README 中列出的所有拓展功能，均是在此基础之上完全定制与自主构建而成的。
