# Luka Piplica — Portfolio & Technischer Blog

<p align="left">
  <a href="./README.md">🇺🇸 English</a> │
  <a href="./README.hr.md">🇭🇷 Hrvatski</a> │
  <a href="./README.es.md">🇪🇸 Español</a> │
  <a href="./README.de.md">🇩🇪 Deutsch</a> │
  <a href="./README.ja.md">🇯🇵 日本語</a> │
  <a href="./README.zh.md">🇨🇳 中文</a>
</p>

Ein hochperformantes, vollständig lokalisiertes persönliches Portfolio und eine technische Wissensdatenbank, entwickelt mit Astro, TypeScript und Tailwind CSS. Umfasst IT-Infrastruktur für Unternehmen, Netzwerkinfrastruktur, Hardwarediagnose und Systemhärtung.

Basiert auf dem Astro Rocket-Theme — wobei die Routing-Engine, das i18n-System, die Suchebenen und die Content-Pipelines von Grund auf neu entwickelt wurden.

---

## 🛠️ Tech Stack

| Ebene | Technologie | Anmerkungen |
| :--- | :--- | :--- |
| **Framework** | Astro | SSG mit Content Collections |
| **Styling** | Tailwind CSS | Semantische Design-Tokens |
| **Sprache** | TypeScript | Strikte Schemata über alle Collections hinweg |
| **Strukturierte Daten** | Schema.org / `schema-dts` | JSON-LD Integration |

---

## 🚀 Was ich gebaut habe

Das Basis-Theme stellte Layout-Komponenten und grundlegendes Routing zur Verfügung. Alles Nachfolgende wurde darauf aufbauend von Grund auf neu konzipiert und implementiert.

### 1. Vollständiges i18n-System — 6 Sprachen, jede Route
Das Theme verfügte über Platzhalter-i18n-Hooks, enthielt jedoch keine tatsächlichen Übersetzungsdaten, kein Routing mit Sprach-Präfixen für `/blog` und keine systematische Methode zur Verarbeitung dynamischer Zeichenfolgen.

* **Was ich gebaut habe:** Hinzufügen von Routen mit Sprach-Präfixen für `/blog` und `/[...slug]` nach dem Vorbild des bestehenden `/projects`-Musters — Erstellung von `[locale]/blog/index.astro`, `[locale]/blog/[...slug].astro` und einer gemeinsam genutzten `BlogContent.astro`-Komponente.
* **Abdeckung der Lokalisierung:** Befüllung aller 6 Sprachdateien (`en`, `hr`, `de`, `es`, `ja`, `zh`) mit Übersetzungsschlüsseln für jeden UI-String: Artikel-Metadaten (Share-Label, Lesezeit, "Auf dieser Seite", Daten), Navigations-Labels, Such-Strings und Theme-Steuerelemente (Modus, Farbe, System/Hell/Dunkel-Labels).
* **Sprachabhängige Formatierung:** Implementierung einer sprachabhängigen Datumsformatierung über `Intl.DateTimeFormat`, sodass Daten je nach Sprache korrekt gerendert werden (z. B. *19. Mai 2026* auf Deutsch).
* **Dynamische String-Interpolation:** Integration einer Regex-basierten String-Interpolation innerhalb der Komponenten für kontextuelle Vorlagen-Strings wie `Veröffentlicht am {date}` oder `Keine Ergebnisse gefunden für "{query}"`.
* **Lokalisierung von Dropdowns:** Vollständige Lokalisierung von `ThemeModeDropdown`, `ThemeSelectorDropdown` und `ThemeSelector` — einschließlich Farbnamen und Modus-Labels.

> **Unterstützte Sprachen:** Englisch (Standard, kein Präfix) · Kroatisch `/hr` · Deutsch `/de` · Spanisch `/es` · Japanisch `/ja` · Chinesisch `/zh`

### 2. Deterministisches, sprachabhängiges Link-Routing
Es gab einen Fehler, bei dem das Klicken auf einen Projekt-Link in einem englischen Blog-Beitrag zu `/zh/projects/...` anstatt zum korrekten präfixfreien `/projects/...` führte.

**Die Ursache — das Zusammenspiel zweier Probleme:**
1. Das Skript zur Sprachverfolgung in `BaseLayout.astro` setzte die gespeicherte Sprache beim Aufruf von `/`, `/projects`, `/about` und `/contact` auf `en` zurück — `/blog` fehlte jedoch. Der Besuch einer lokalisierten Seite und der anschließende Wechsel zu `/blog/some-post` hinterließ eine veraltete Sprache im `localStorage`.
2. Der Link-Rewriter in `BlogLayout.astro` las die Zielsprache aus dem `localStorage` und `navigator.language` anstatt aus der serverseitig von Astro gerenderten Seitensprache aus — Links wurden also basierend auf der jeweils gecachten Sprache umgeschrieben.

**Die Lösung:**
* Hinzufügen von `/blog` zur Reset-Bedingung für die bevorzugte Sprache in `BaseLayout.astro`.
* Neuschreiben des Link-Rewriters unter Verwendung von `define:vars={{ pageLocale: locale }}`, um die von Astro gerenderte Sprache direkt an das Inline-Client-Skript zu übergeben — was das Routing unabhängig vom Browser-Status vollständig deterministisch macht.
* Anwendung desselben Fixes auf `ProjectLayout.astro` für Querverweise innerhalb von Projektseiten.

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
          // schreibe /projects/... Links zu /{locale}/projects/... um
        }
      } catch {}
    })();
  </script>
```

Englische Routen bleiben präfixfrei, wie es über `prefixDefaultLocale: false` in `astro.config.mjs` konfiguriert ist.

---

### 3. Befehlspaletten-Suche ohne Endpunkte (Zero-Endpoint)
Das Theme verfügte über keinerlei Suchfunktion. Ich habe eine vollständige Befehlspalette ohne Backend-Endpunkte oder externe Suchbibliotheken aufgebaut.

**Funktionsweise:**
* **Statisches Indexieren zur Build-Zeit:** Während des Build-Prozesses fragen die Kompilierzeit-Fetcher von Astro sowohl die `blog`- als auch die `projects`-Content-Collections ab und serialisieren das Ergebnis als ein direkt in `SearchModal.astro` eingebettetes Inline-JSON-Array — keine HTTP-Anfragen zur Laufzeit, keine externen APIs.
* **Routen-Mapping:** Der Indexer entfernt die Sprach-Präfixe aus den Content-IDs, sodass jeder Eintrag genau auf eine korrekte, sprachabhängige Route verweist.
* **Fuzzy-Matching:** Das clientseitige Fuzzy-Matching hebt übereinstimmende Teilstrings hervor, indem es in Echtzeit `<mark>`-Elemente injiziert.
* **Tastatur-Interaktivität:** Vollständig über die Tastatur steuerbar: `⌘K` oder `/` zum Öffnen · `Esc` zum Schließen · `↑`/`↓` zum Navigieren · `Enter` zum Bestätigen.

*Die Schaltfläche für die Suche ist in die Navigationsleiste integriert und auf jeder Seite in allen Sprachen verfügbar.*

---

### 4. Automatische Lesezeit-Pipeline
Jeder Blog-Beitrag zeigt eine berechnete Lesezeit an. Die Pipeline läuft zur Kompilierzeit innerhalb des Post-Layouts ab:
* Entfernt MDX/HTML-Markup aus dem rohen Content-Tree, um reinen Text zu extrahieren.
* Berechnet die Lesezeit basierend auf einem Richtwert von 200 Wörtern pro Minute (WPM).
* Nutzt die Wortanzahl der Meta-Beschreibung des Beitrags als Fallback, falls kein Fließtext verfügbar ist.
* Gibt über den aktiven i18n-Wrapper einen lokalisierten String aus (z. B. `3 min read` / `3 Min. Lesezeit`).

---

### 5. Deduplizierung von Inhalten auf der Startseite
Da die Inhalte in sprachspezifischen MDX-Dateien (`blog/en/post.mdx`, `blog/de/post.mdx` usw.) gespeichert sind, zeigte der Bereich „Neueste Beiträge“ auf der Startseite denselben Artikel mehrfach an — einmal pro Sprachvariante, sortiert nach Veröffentlichungsdatum.

**Die Lösung:** Die Inhaltsabfragen für die Startseite filtern nun so, dass nur Einträge aus der `en`-Collection berücksichtigt werden, bevor die 3 neuesten Beiträge und 4 neuesten Projekte ausgewählt werden. Dies stellt sicher, dass jedes Inhaltselement genau einmal erscheint, unabhängig davon, wie viele Sprachdateien dafür existieren.

---

### 6. Dynamische mehrsprachige RSS-Feeds
Der Standard-RSS-Feed stellte Inhalte nur auf Englisch unter `/rss.xml` bereit.

* **Was ich entwickelt habe:** Eine dynamische Route unter `src/pages/[locale]/rss.xml.ts` implementiert, um RSS-Feeds für alle konfigurierten Locales (z. B. `/hr/rss.xml`, `/es/rss.xml`) dynamisch zu generieren.
* **Inhaltsfilterung:** Feeds filtern Blog-Beiträge automatisch nach der passenden Locale und formatieren Links mit dem korrekten Sprachpräfix (z. B. `/hr/blog/...`).
* **XML-Anpassung:** Feeds injizieren den korrekten `<language>`-Code (z. B. `hr`, `zh-cn`, `es`) und hängen den Sprachnamen an den Feed-Titel an (z. B. *Luka Piplica (Hrvatski)*).
* **Auto-Discovery:** Die RSS-Links in `BlogContent.astro`, `BlogLayout.astro` und das `<link rel="alternate">`-Tag in `BaseLayout.astro` so angepasst, dass sie sich basierend auf der aktiven Sprache des Nutzers dynamisch aktualisieren.

---

### 7. Dynamische strukturierte FAQ-Daten (JSON-LD)
Strukturierte FAQ-Daten sind entscheidend für die Suchmaschinenoptimierung (SEO), aber fest codierte statische JSON-Schema-Dateien unterstützen keine mehrsprachige Übersetzung.

* **Was ich entwickelt habe:** Das **FAQPage** JSON-LD-Schema dynamisch direkt in `AboutContent.astro` generiert, unter Verwendung von Einträgen aus dem Übersetzungs-Dictionary (`aboutPage.faq.q1` bis `q8` & Antworten).
* **Integration:** `PageLayout.astro` so erweitert, dass es `extraSchemas`-Props akzeptiert und diese an den JSON-LD-Skript-Injektor von `BaseLayout.astro` weiterleitet. Dadurch werden die übersetzten strukturierten FAQ-Daten basierend auf der aktiven Sprache (`/about`, `/hr/about`, etc.) dynamisch eingebettet.

## 📁 Projektstruktur

```
src/
├── components/
│   ├── blog/
│   │   ├── ArticleHero.astro
│   │   ├── BlogCard.astro
│   │   ├── Comments.astro
│   │   ├── RelatedPosts.astro
│   │   ├── ShareButtons.astro         # Lokalisiertes "Teilen:"-Label
│   │   └── TableOfContents.astro      # Lokalisierte "Auf dieser Seite"-Überschrift
│   ├── effects/
│   │   ├── CursorTrail.astro
│   │   └── LetterGlitch.tsx
│   ├── layout/
│   │   ├── Header.astro               # Such-Button (Desktop + Mobil)
│   │   ├── LanguageSwitcher.astro
│   │   ├── ThemeModeDropdown.astro    # Lokalisierte Modus-Labels (System/Hell/Dunkel)
│   │   ├── ThemeSelector.astro        # Lokalisierte Farbnamen
│   │   └── ThemeSelectorDropdown.astro
│   ├── patterns/
│   │   ├── BlogContent.astro          # Gemeinsam genutzte Blog-Übersichts-Komponente
│   │   ├── HomeContent.astro          # Startseite mit sprachgefilterten Inhalten
│   │   └── ProjectsContent.astro
│   ├── projects/
│   │   ├── ProjectGallery.astro
│   │   ├── ProjectHero.astro
│   │   └── ProjectShowcase.astro
│   ├── search/
│   │   └── SearchModal.astro          # Befehlspalette + interner Build-Zeit-Index
│   └── seo/
│   │   ├── Breadcrumbs.astro
│   │   ├── JsonLd.astro
│   │   └── SEO.astro
├── config/
│   ├── i18n.config.ts
│   ├── nav.config.ts
│   └── site.config.ts
├── content/
│   ├── blog/
│   │   ├── en/                        # Englische Einträge (Source of Truth)
│   │   ├── hr/                        # Kroatische Übersetzungen
│   │   ├── de/                        # Deutsche Übersetzungen
│   │   ├── es/                        # Spanische Übersetzungen
│   │   ├── ja/                        # Japanische Übersetzungen
│   │   └── zh/                        # Chinesische Übersetzungen
│   └── projects/
│   │   ├── en/                        # Englische Projekte (Source of Truth)
│   │   ├── hr/ de/ es/ ja/ zh/        # Regionale Übersetzungsvarianten
│   │   └── ...
├── i18n/
│   ├── index.ts                       # t(), localizedPath() Helper
│   ├── en.json
│   ├── hr.json
│   ├── de.json
│   ├── es.json
│   ├── ja.json
│   └── zh.json
├── layouts/
│   ├── BaseLayout.astro               # Globales Sprach-Tracking + Skript für bevorzugte Sprache
│   ├── BlogLayout.astro               # Deterministischer, sprachabhängiger Link-Rewriter
│   ├── PageLayout.astro
│   └── ProjectLayout.astro            # Gleicher Link-Rewriter angewendet
├── lib/
│   └── utils.ts                       # formatDate() mit Intl.DateTimeFormat-Sprachunterstützung
├── pages/
│   ├── index.astro                    # Startseite (i18n + Filter für reine Nur-Englisch-Inhalte)
│   ├── about.astro
│   ├── contact.astro
│   ├── blog/
│   │   ├── index.astro                # Englische Blog-Übersicht (Thin Wrapper)
│   │   └── [...slug].astro
│   ├── projects/
│   │   ├── index.astro
│   │   └── [slug].astro
│   ├── [locale]/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   ├── blog/
│   │   │   ├── index.astro            # Blog-Übersicht mit Sprach-Präfix
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
│   ├── themes/                        # 13 Farb-Themes (Bernstein, Blau, Cyan, ...)
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

## ⚙️ Erste Schritte

**Voraussetzungen:** Node.js und pnpm

```bash
git clone https://github.com/lukapiplica/luka-piplica-portfolio
cd luka-piplica-portfolio
pnpm install
```

```bash
pnpm run dev    # Dev-Server mit Hot-Reload starten
pnpm run build  # Production-Build erstellen
```

---

## 📁 Lokalisierungsbeispiel

Die Übersetzungswörterbücher befinden sich in `src/i18n/*.json`. Komponenten rufen diese über den `t()`-Helper ab:

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

Wörterbuchschlüssel unterstützen die Interpolation für dynamische Zeichenfolgen:

```json
{
  "search": {
    "placeholder": "Blogs und Projekte suchen...",
    "noResults": "Keine Ergebnisse gefunden für \"{query}\"",
    "shortcutHint": "Esc zum Schließen"
  },
  "blog": {
    "publishedOn": "Veröffentlicht am {date}",
    "minRead": "Min. Lesezeit",
    "onThisPage": "Auf dieser Seite"
  }
}
```

---

## 👥 Credits

Basiert auf dem [Astro Rocket](https://astro.build/themes/details/astro-rocket/)-Theme von [hansmartensdev](https://github.com/hansmartensdev/Astro-Rocket). Das ursprüngliche Theme stellte das visuelle Designsystem und die Komponenten-Grundlagen zur Verfügung — alles, was in dieser README aufgeführt ist, wurde darauf aufbauend maßgeschneidert entwickelt.