# Luka Piplica — ポートフォリオ＆テクニカルブログ

<p align="left">
  <a href="./README.md">🇺🇸 English</a> │
  <a href="./README.hr.md">🇭🇷 Hrvatski</a> │
  <a href="./README.es.md">🇪🇸 Español</a> │
  <a href="./README.de.md">🇩🇪 Deutsch</a> │
  <a href="./README.ja.md">🇯🇵 日本語</a> │
  <a href="./README.zh.md">🇨🇳 中文</a>
</p>

Astro、TypeScript、およびTailwind CSSで構築された、完全にローカライズされた高パフォーマンスな個人ポートフォリオ兼テクニカルナレッジベース。エンタープライズIT運用、ネットワークインフラ、ハードウェア診断、およびシステム高セキュリティ化（セキュリティ硬化 / ハードニング）を網羅しています。

Astro Rocketテーマをベースに開発されており、ルーティングエンジン、i18nシステム、検索レイヤー、およびコンテンツパイプラインをゼロから完全に再設計・実装しています。

---

## 🛠️ 技術スタック

| レイヤー | 使用技術 | 備考 |
| :--- | :--- | :--- |
| **フレームワーク** | Astro | Content Collectionsを使用したSSG（静的サイト生成） |
| **スタイリング** | Tailwind CSS | セマンティックなデザイントークン |
| **言語** | TypeScript | すべてのコレクションにおける厳格なスキーマ定義 |
| **構造化データ** | Schema.org / `schema-dts` | JSON-LDインテグレーション |

---

## 🚀 実装・構築した機能

ベースとなったテーマでは、基本的なレイアウトコンポーネントと簡易的なルーティングのみが提供されていました。以下に挙げる機能はすべて、そのベースの上にゼロから設計および実装したものです。

### 1. 完全なi18nシステム — 6言語、すべてのルートに対応
元々のテーマにはプレースホルダーとしてのi18nフック（hooks）は存在していたものの、実際の翻訳データ、`/blog`における言語プレフィックス付きのルーティング、および動的文字列を体系的に処理する方法が欠けていました。

* **実装内容:** 既存の`/projects`のパターンに倣い、`/blog`および`/[...slug]`に対して言語プレフィックス付きのルートを追加しました。これにより、`[locale]/blog/index.astro`、`[locale]/blog/[...slug].astro`、および共通の`BlogContent.astro`コンポーネントを作成しました。
* **ローカライズの網羅性:** すべてのUI文字列について、6つすべての言語ファイル（`en`、`hr`、`de`、`es`、`ja`、`zh`）に翻訳キーを設定しました。これには、記事のメタデータ（共有ラベル、読了時間、「このページの内容」、日付）、ナビゲーションラベル、検索文字列、およびテーマコントロール（モード、カラー、システム/ライト/ダークのラベル）が含まれます。
* **言語を認識するフォーマット:** `Intl.DateTimeFormat`を介した言語認識型の日付フォーマットを実装し、各言語に応じて日付が正しくレンダリングされるようにしました（例: 日本語では *2026年5月19日*）。
* **動的文字列の補間:** コンポーネント内で正規表現（regex）を利用した文字列補間機能を構築し、`{date}に公開` や `"{query}" に一致する結果が見つかりませんでした` といった、文脈に応じたテンプレート文字列に対応させました。
* **ドロップダウンのローカライズ:** `ThemeModeDropdown`、`ThemeSelectorDropdown`、および`ThemeSelector`を完全にローカライズし、カラー名やモードのラベルも対応させました。

> **対応言語:** 英語（デフォルト、プレフィックスなし）· クロアチア語 `/hr` · ドイツ語 `/de` · スペイン語 `/es` · 日本語 `/ja` · 中国語 `/zh`

### 2. 決定論的で言語を認識するリンクルーティング
英語のブログ記事からプロジェクトのリンクをクリックした際、正しいプレフィックスなしの `/projects/...` ではなく、`/zh/projects/...` にルーティングされてしまうというバグが存在していました。

**根本原因 — 2つの問題の連鎖:**
1. `BaseLayout.astro` 内の言語追跡スクリプトは、`/`、`/projects`、`/about`、および `/contact` の訪問時には保存された言語を `en` にリセットしていましたが、`/blog` が漏れていました。そのため、ローカライズされたページを訪問した後に `/blog/some-post` へ移動すると、`localStorage` に古い言語が残ったままになっていました。
2. `BlogLayout.astro` 内のリンク書き換え処理（link rewriter）が、Astroサーバー側でレンダリングされたページの言語（locale）からではなく、`localStorage` や `navigator.language` からターゲット言語を読み込んでいたため、キャッシュされていた言語に基づいてリンクが書き換えられてしまっていました。

**解決策:**
* `BaseLayout.astro` 内の優先言語リセット条件に `/blog` を追加しました。
* `define:vars={{ pageLocale: locale }}` を使用してリンク書き換え処理を再設計し、Astroがレンダリングした言語をクライアント側のインラインスクリプトに直接渡すようにしました。これにより、ブラウザの状態に関係なく、ルーティングが完全に決定論的（確実）になりました。
* プロジェクトページ内のクロスリンクに対しても、同様の修正を `ProjectLayout.astro` に適用しました。

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
          // /projects/... リンクを /{locale}/projects/... に書き換える
        }
      } catch {}
    })();
  </script>
```

英語のルートは、`astro.config.mjs` 内の `prefixDefaultLocale: false` の設定通り、プレフィックスなしのまま維持されます。

---

### 3. バックエンド不要（Zero-Endpoint）のコマンドパレット検索
元のテーマには検索機能がありませんでした。そのため、バックエンドのエンドポイントや外部の検索ライブラリを一切使用せず、完全なコマンドパレット機能を構築しました。

**仕組み:**
* **ビルド時の静的インデックス生成:** ビルド時に、Astroのコンパイル時フェッチャーが `blog` と `projects` の両方のコンテンツコレクションをクエリし、その結果をインラインのJSON配列として `SearchModal.astro` 内に直接埋め込み（シリアライズ）します。実行時のHTTPリクエストや外部APIへの依存はありません。
* **ルートのマッピング:** インデサーがコンテンツIDから言語プレフィックスを削除することで、各エントリが言語を認識した単一の正しいルートにマッピングされます。
* **あいまい検索（Fuzzy Matching）:** クライアント側であいまい検索を行い、一致した部分文字列に `<mark>` 要素をリアルタイムで注入してハイライト表示します。
* **キーボード操作への対応:** 完全にキーボードのみで操作可能：`⌘K` または `/` で開く · `Esc` で閉じる · `↑`/`↓` で移動 · `Enter` で決定（遷移）。

*検索ボタンはナビゲーションバーに統合されており、すべての言語の全ページから利用できます。*

---

### 4. 読了時間の自動計算パイプライン
各ブログ記事には、計算された読了時間が表示されます。このパイプラインは、コンパイル時に記事のレイアウト内で実行されます。
* 生のコンテンツツリーからMDX/HTMLマークアップを削除し、プレーンテキストを抽出します。
* 1分あたり200語（200 WPM）を基準として読了時間を計算します。
* 本文のコンテンツが取得できない場合は、記事のメタディスクリプション（meta description）の単語数をフォールバックとして使用します。
* 有効なi18nラッパーを介して、ローカライズされた文字列（例：`3分で読めます` / `3 min read`）を出力します。

---

### 5. ホームページにおけるコンテンツの重複排除
コンテンツが言語ごとのMDXファイル（`blog/en/post.mdx`、`blog/de/post.mdx` など）に保存されているため、ホームページの「最新記事」セクションに、公開日順にソートされた同じ記事が言語バリアントごとに複数回表示されてしまう問題がありました。

**解決策:** ホームページのコンテンツクエリにおいて、最新の3つの記事と4つのプロジェクトを選択する前に、まずは `en` コレクションのエントリのみを含むようにフィルタリングを追加しました。これにより、作成された言語ファイルの数に関係なく、各コンテンツが必ず1回だけ表示されるようになります。

---

### 6. 動的な多言語RSSフィード
デフォルトのRSSフィードでは、`/rss.xml` で英語のコンテンツのみを配信していました。

* **開発内容:** `src/pages/[locale]/rss.xml.ts` に動的ルートを実装し、設定されたすべてのロケール（例: `/hr/rss.xml`、`/es/rss.xml`）のRSSフィードを動的に生成するようにしました。
* **コンテンツのフィルタリング:** 各ロケールに一致するブログ記事を自動的にフィルタリングし、正しい言語プレフィックス（例: `/hr/blog/...`）を含んだリンク形式に整形するようにしました。
* **XMLのカスタマイズ:** フィードに適切な `<language>` コード（例: `hr`、`zh-cn`、`es`）を挿入し、フィードのタイトルに言語名を追加（例: *Luka Piplica (Hrvatski)*）するようにしました。
* **自動検出（Auto-Discovery）:** `BlogContent.astro`、`BlogLayout.astro` 内のRSSリンク、および `BaseLayout.astro` 内の `<link rel="alternate">` タグが、ユーザーの閲覧中の言語に基づいて動的に切り替わるように対応しました。

---

### 7. FAQ構造化データの動的生成（JSON-LD）
FAQの構造化データは検索エンジン最適化（SEO）に不可欠ですが、ハードコードされた静的なJSONスキーマファイルでは多言語翻訳に対応できません。

* **開発内容:** 翻訳ディクショナリのエントリ（`aboutPage.faq.q1` 〜 `q8` およびその回答）を使用し、`AboutContent.astro` 内で **FAQPage** JSON-LD スキーマをリアルタイムに動的生成するようにしました。
* **インテグレーション:** `PageLayout.astro` を拡張して `extraSchemas` プロップスを受け取れるようにし、それを `BaseLayout.astro` のJSON-LDスクリプトインジェクターに渡すようにしました。これにより、アクティブな言語（`/about`、`/hr/about` など）に応じて、翻訳されたFAQ構造化データが動的に埋め込まれます。

## 📁 プロジェクト構造

```
src/
├── components/
│   ├── blog/
│   │   ├── ArticleHero.astro
│   │   ├── BlogCard.astro
│   │   ├── Comments.astro
│   │   ├── RelatedPosts.astro
│   │   ├── ShareButtons.astro         # ローカライズされた「共有」ラベル
│   │   └── TableOfContents.astro      # ローカライズされた「このページの内容」見出し
│   ├── effects/
│   │   ├── CursorTrail.astro
│   │   └── LetterGlitch.tsx
│   ├── layout/
│   │   ├── Header.astro               # 検索ボタン（デスクトップ + モバイル）
│   │   ├── LanguageSwitcher.astro
│   │   ├── ThemeModeDropdown.astro    # ローカライズされたモードラベル（システム/ライト/ダーク）
│   │   ├── ThemeSelector.astro        # ローカライズされたカラー名
│   │   └── ThemeSelectorDropdown.astro
│   ├── patterns/
│   │   ├── BlogContent.astro          # 共通のブログインデックスコンポーネント
│   │   ├── HomeContent.astro          # 言語フィルタリングされたコンテンツを含むホームページ
│   │   └── ProjectsContent.astro
│   ├── projects/
│   │   ├── ProjectGallery.astro
│   │   ├── ProjectHero.astro
│   │   └── ProjectShowcase.astro
│   ├── search/
│   │   └── SearchModal.astro          # コマンドパレット + ビルド時のインラインインデックス
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
│   │   ├── en/                        # 英語のエントリ（Source of truth / 信頼できる唯一の情報源）
│   │   ├── hr/                        # クロアチア語の翻訳
│   │   ├── de/                        # ドイツ語の翻訳
│   │   ├── es/                        # スペイン語の翻訳
│   │   ├── ja/                        # 日本語の翻訳
│   │   └── zh/                        # 中国語の翻訳
│   └── projects/
│   │   ├── en/                        # 英語のプロジェクト（Source of truth）
│   │   ├── hr/ de/ es/ ja/ zh/        # 地域別の翻訳バリアント
│   │   └── ...
├── i18n/
│   ├── index.ts                       # t(), localizedPath() ヘルパー関数
│   ├── en.json
│   ├── hr.json
│   ├── de.json
│   ├── es.json
│   ├── ja.json
│   └── zh.json
├── layouts/
│   ├── BaseLayout.astro               # グローバルな言語追跡 + 優先言語スクリプト
│   ├── BlogLayout.astro               # 決定論的で言語を認識するリンク書き換え処理
│   ├── PageLayout.astro
│   └── ProjectLayout.astro            # 同じリンク書き換え処理を適用
├── lib/
│   └── utils.ts                       # Intl.DateTimeFormatの言語サポートを含んだ formatDate()
├── pages/
│   ├── index.astro                    # ホームページ（i18n + 英語限定のコンテンツフィルター）
│   ├── about.astro
│   ├── contact.astro
│   ├── blog/
│   │   ├── index.astro                # 英語のブログ一覧（薄いラッパー / thin wrapper）
│   │   └── [...slug].astro
│   ├── projects/
│   │   ├── index.astro
│   │   └── [slug].astro
│   ├── [locale]/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   ├── blog/
│   │   │   ├── index.astro            # 言語プレフィックス付きのブログ一覧
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
│   ├── themes/                        # 13のカラーテーマ（アンバー、ブルー、シアンなど）
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

## ⚙️ はじめに（クイックスタート）

**前提条件:** Node.js および pnpm

```bash
git clone https://github.com/lukapiplica/luka-piplica-portfolio
cd luka-piplica-portfolio
pnpm install
```

```bash
pnpm run dev    # ホットリロード（開発サーバーの起動）
pnpm run build  # 本番環境用のビルド
```

---

## 📁 ローカライズの例

翻訳辞書ファイルは `src/i18n/*.json` に配置されています。各コンポーネント内からは `t()` ヘルパー関数を介して呼び出します：

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
辞書のキーは、動的な文字列を扱うための変数補間に対応しています：

```json
{
  "search": {
    "placeholder": "ブログやプロジェクトを検索...",
    "noResults": "\"{query}\" に一致する結果が見つかりませんでした",
    "shortcutHint": "Esc で閉じる"
  },
  "blog": {
    "publishedOn": "{date} に公開",
    "minRead": "分で読めます",
    "onThisPage": "このページの内容"
  }
}
```

---

## 👥 クレジット（謝辞）

[hansmartensdev](https://github.com/hansmartensdev/Astro-Rocket) 氏による [Astro Rocket](https://astro.build/themes/details/astro-rocket/) テーマをベースに構築されています。オリジナルのテーマからは、ビジュアルデザインシステムと基礎となるコンポーネントが提供されました。このREADMEに記載されているすべての追加機能は、その上にカスタム構築されたものです。