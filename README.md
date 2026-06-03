# Luka Piplica — Portfolio & Technical Blog

<p align="left">
  <a href="./README.md">🇺🇸 English</a> │
  <a href="./README.hr.md">🇭🇷 Hrvatski</a> │
  <a href="./README.es.md">🇪🇸 Español</a> │
  <a href="./README.de.md">🇩🇪 Deutsch</a> │
  <a href="./README.ja.md">🇯🇵 日本語</a> │
  <a href="./README.zh.md">🇨🇳 中文</a>
</p>

A high-performance, fully localized personal portfolio and technical knowledge base built with Astro, TypeScript, and Tailwind CSS. Covers enterprise IT operations, network infrastructure, hardware diagnostics, and systems hardening.

Built on the Astro Rocket theme — with the routing engine, i18n system, search layer, and content pipelines completely re-engineered from scratch.

---

## 🛠️ Tech Stack

| Layer | Technology | Notes |
| :--- | :--- | :--- |
| **Framework** | Astro | SSG with Content Collections |
| **Styling** | Tailwind CSS | Semantic design tokens |
| **Language** | TypeScript | Strict schemas across all collections |
| **Structured data** | Schema.org / `schema-dts` | JSON-LD integration |

---

## 🚀 What I Built

The base theme provided layout components and basic routing. Everything below was designed and implemented from scratch on top of it.

### 1. Full i18n system — 6 languages, every route
The theme had placeholder i18n hooks but no actual translation data, no locale-prefixed routing for `/blog`, and no systematic way to handle dynamic strings.

* **What I built:** Added locale-prefixed routes for `/blog` and `/[...slug]` following the existing `/projects` pattern — creating `[locale]/blog/index.astro`, `[locale]/blog/[...slug].astro`, and a shared `BlogContent.astro` component.
* **Localization Coverage:** Populated all 6 locale files (`en`, `hr`, `de`, `es`, `ja`, `zh`) with translation keys for every UI string: article metadata (share label, reading time, "On this page", dates), navigation labels, search strings, and theme controls (mode, colour, system/light/dark labels).
* **Locale-Aware Formatting:** Implemented locale-aware date formatting via `Intl.DateTimeFormat` so dates render correctly per language (e.g. *19. Mai 2026* in German).
* **Dynamic String Interpolation:** Built regex-backed string interpolation inside components for contextual template strings like `Published on {date}` or `No results found for "{query}"`.
* **Dropdown Localization:** Fully localized `ThemeModeDropdown`, `ThemeSelectorDropdown`, and `ThemeSelector` — including colour names and mode labels.

> **Supported locales:** English (default, no prefix) · Croatian `/hr` · German `/de` · Spanish `/es` · Japanese `/ja` · Chinese `/zh`

### 2. Deterministic locale-aware link routing
There was a bug where clicking a project link from an English blog post routed to `/zh/projects/...` instead of the correct prefix-less `/projects/...`.

**Root cause — two problems working together:**
1. The `BaseLayout.astro` locale-tracking script reset stored locale to `en` when visiting `/`, `/projects`, `/about`, and `/contact` — but `/blog` was missing. Visiting a localized page and then going to `/blog/some-post` left a stale locale in `localStorage`.
2. The link rewriter in `BlogLayout.astro` was reading the target locale from `localStorage` and `navigator.language` rather than from the Astro server-rendered page locale — so links were rewritten based on whatever locale happened to be cached.

**The Fix:**
* Added `/blog` to the preferred-locale reset condition in `BaseLayout.astro`.
* Rewrote the link rewriter using `define:vars={{ pageLocale: locale }}` to pass the Astro-rendered locale directly into the inline client script — making routing fully deterministic regardless of browser state.
* Applied the same fix to `ProjectLayout.astro` for cross-links inside project pages.

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
          // rewrite /projects/... links to /{locale}/projects/...
        }
      } catch {}
    })();
  </script>
```

English routes stay prefix-less as configured with `prefixDefaultLocale: false` in `astro.config.mjs`.

---

### 3. Zero-endpoint command palette search
The theme had no search. I built a full command palette without any backend endpoints or external search libraries.

**How it works:**
* **Build-Time Static Indexing:** At build time, Astro's compile-time fetchers query both the `blog` and `projects` content collections and serialize the result as an inline JSON array embedded directly inside `SearchModal.astro` — no runtime HTTP requests, no external APIs.
* **Route Mapping:** The indexer strips locale prefixes from content IDs so each entry maps to a single correct locale-aware route.
* **Fuzzy Matching:** Client-side fuzzy matching highlights matched substrings by injecting `<mark>` elements in real time.
* **Keyboard Interactivity:** Fully keyboard-driven: `⌘K` or `/` to open · `Esc` to close · `↑`/`↓` to navigate · `Enter` to go.

*The search button is integrated into the navbar and is available on every page across all locales.*

---

### 4. Automated reading time pipeline
Each blog post shows a calculated reading time. The pipeline runs at compile time inside the post layout:
* Strips MDX/HTML markup from the raw content tree to extract plain text.
* Calculates reading time against a 200 WPM baseline.
* Falls back to the post's meta description word count if body content is unavailable.
* Outputs a localized string (e.g., `3 min read` / `3 Min. Lesezeit`) through the active i18n wrapper.

---

### 5. Homepage content deduplication
With content stored in per-locale MDX files (`blog/en/post.mdx`, `blog/de/post.mdx`, etc.), the homepage "latest posts" section was showing the same article multiple times — once per locale variant, sorted by publish date.

**The Fix:** Homepage content queries now filter to only include entries from the `en` collection before selecting the most recent 3 posts and 4 projects. This ensures each piece of content appears exactly once regardless of how many locale files exist for it.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── blog/
│   │   ├── ArticleHero.astro
│   │   ├── BlogCard.astro
│   │   ├── Comments.astro
│   │   ├── RelatedPosts.astro
│   │   ├── ShareButtons.astro         # Localized "Share:" label
│   │   └── TableOfContents.astro      # Localized "On this page" heading
│   ├── effects/
│   │   ├── CursorTrail.astro
│   │   └── LetterGlitch.tsx
│   ├── layout/
│   │   ├── Header.astro               # Search button (desktop + mobile)
│   │   ├── LanguageSwitcher.astro
│   │   ├── ThemeModeDropdown.astro    # Localized mode labels (System/Light/Dark)
│   │   ├── ThemeSelector.astro        # Localized colour names
│   │   └── ThemeSelectorDropdown.astro
│   ├── patterns/
│   │   ├── BlogContent.astro          # Shared blog index component
│   │   ├── HomeContent.astro          # Homepage with locale-filtered content
│   │   └── ProjectsContent.astro
│   ├── projects/
│   │   ├── ProjectGallery.astro
│   │   ├── ProjectHero.astro
│   │   └── ProjectShowcase.astro
│   ├── search/
│   │   └── SearchModal.astro          # Command palette + inline build-time index
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
│   │   ├── en/                        # English entries (Source of truth)
│   │   ├── hr/                        # Croatian translations
│   │   ├── de/                        # German translations
│   │   ├── es/                        # Spanish translations
│   │   ├── ja/                        # Japanese translations
│   │   └── zh/                        # Chinese translations
│   └── projects/
│       ├── en/                        # English projects (Source of truth)
│       ├── hr/ de/ es/ ja/ zh/        # Regional translation variants
│       └── ...
├── i18n/
│   ├── index.ts                       # t(), localizedPath() helpers
│   ├── en.json
│   ├── hr.json
│   ├── de.json
│   ├── es.json
│   ├── ja.json
│   └── zh.json
├── layouts/
│   ├── BaseLayout.astro               # Global locale tracking + preferred-locale script
│   ├── BlogLayout.astro               # Deterministic locale-aware link rewriter
│   ├── PageLayout.astro
│   └── ProjectLayout.astro            # Same link rewriter applied
├── lib/
│   └── utils.ts                       # formatDate() with Intl.DateTimeFormat locale support
├── pages/
│   ├── index.astro                    # Homepage (i18n + en-only content filter)
│   ├── about.astro
│   ├── contact.astro
│   ├── blog/
│   │   ├── index.astro                # English blog listing (thin wrapper)
│   │   └── [...slug].astro
│   ├── projects/
│   │   ├── index.astro
│   │   └── [slug].astro
│   ├── [locale]/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   ├── blog/
│   │   │   ├── index.astro            # Locale-prefixed blog listing
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
│   ├── themes/                        # 13 colour themes (amber, blue, cyan, ...)
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

## ⚙️ Getting Started

**Prerequisites:** Node.js and pnpm

```bash
git clone https://github.com/lukapiplica/luka-piplica-portfolio
cd luka-piplica-portfolio
pnpm install
```

```bash
pnpm run dev    # start dev server with hot reload
pnpm run build  # production build
```

---

## 📁 Localization Example

Translation dictionaries live in `src/i18n/*.json`. Components consume them through the `t()` helper:

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
Dictionary keys support interpolation for dynamic strings:

```json
{
  "search": {
    "placeholder": "Search blogs and projects...",
    "noResults": "No results found for \"{query}\"",
    "shortcutHint": "Esc to close"
  },
  "blog": {
    "publishedOn": "Published on {date}",
    "minRead": "min read",
    "onThisPage": "On this page"
  }
}
```

---

## 👥 Credits

Built on top of the [Astro Rocket](https://astro.build/themes/details/astro-rocket/) theme by [hansmartensdev](https://github.com/hansmartensdev/Astro-Rocket). The original theme provided the visual design system and component foundations — everything listed in this README was custom-built on top of it.