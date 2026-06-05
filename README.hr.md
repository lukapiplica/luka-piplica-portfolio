# Luka Piplica — Portfolio i tehnički blog

<p align="left">
  <a href="./README.md">🇺🇸 English</a> │
  <a href="./README.hr.md">🇭🇷 Hrvatski</a> │
  <a href="./README.es.md">🇪🇸 Español</a> │
  <a href="./README.de.md">🇩🇪 Deutsch</a> │
  <a href="./README.ja.md">🇯🇵 日本語</a> │
  <a href="./README.zh.md">🇨🇳 中文</a>
</p>

Osobni portfolio i tehnička baza znanja visokih performansi, potpuno lokalizirani i izgrađeni pomoću tehnologija Astro, TypeScript i Tailwind CSS. Pokriva područja IT operacija u poduzećima, mrežne infrastrukture, dijagnostike hardvera i otvrdnjavanja (hardening) sustava.

Izgrađeno na temelju Astro Rocket teme — s time da su mehanizam za usmjeravanje (routing engine), i18n sustav, sloj za pretraživanje i cjevovodi (pipelines) sadržaja u potpunosti prerađeni od nule.

---

## 🛠️ Tehnološki stog (Tech Stack)

| Sloj | Tehnologija | Napomene |
| :--- | :--- | :--- |
| **Okvir (Framework)** | Astro | SSG s Content Collections |
| **Stiliziranje** | Tailwind CSS | Semantički tokeni dizajna |
| **Jezik** | TypeScript | Stroge sheme kroz sve kolekcije |
| **Strukturirani podaci** | Schema.org / `schema-dts` | JSON-LD integracija |

---

## 🚀 Što sam izgradio

Osnovna tema pružala je komponente rasporeda (layout) i bazično usmjeravanje. Sve navedeno u nastavku osmišljeno je i implementirano od nule na temelju toga.

### 1. Potpuni i18n sustav — 6 jezika, svaka ruta
Tema je imala privremene (placeholder) i18n kuke (hooks), ali nije sadržavala stvarne podatke o prijevodima, usmjeravanje s jezičnim prefiksom za `/blog`, kao ni sustavan način za rukovanje dinamičkim tekstualnim nizovima (strings).

* **Što sam izgradio:** Dodao sam rute s jezičnim prefiksom za `/blog` i `/[...slug]` prateći postojeći obrazac za `/projects` — kreirajući `[locale]/blog/index.astro`, `[locale]/blog/[...slug].astro` i zajedničku `BlogContent.astro` komponentu.
* **Pokrivenost lokalizacije:** Popunio sam svih 6 jezičnih datoteka (`en`, `hr`, `de`, `es`, `ja`, `zh`) s ključevima prijevoda za svaki element sučelja: metapodatke članaka (oznaka za dijeljenje, vrijeme čitanja, "Na ovoj stranici", datumi), navigacijske oznake, tekst pretraživanja i kontrole teme (oznake za način rada, boju, sustav/svijetlo/tamno).
* **Formatiranje prilagođeno jeziku:** Implementirao sam formatiranje datuma ovisno o jeziku putem `Intl.DateTimeFormat` kako bi se datumi ispravno prikazivali za svaki jezik (npr. *19. svibnja 2026.* na hrvatskom).
* **Dinamička interpolacija nizova:** Izgradio sam interpolaciju tekstualnih nizova podržanu regularnim izrazima (regex) unutar komponenti za kontekstualne predloške kao što su `Objavljeno {date}` ili `Nema rezultata za "{query}"`.
* **Lokalizacija padajućih izbornika:** Potpuno su lokalizirani `ThemeModeDropdown`, `ThemeSelectorDropdown` i `ThemeSelector` — uključujući nazive boja i oznake načina rada.

> **Podržani jezici:** Engleski (zadano, bez prefiksa) · Hrvatski `/hr` · Njemački `/de` · Španjolski `/es` · Japanski `/ja` · Kineski `/zh`

### 2. Determinističko usmjeravanje veza ovisno o jeziku
Postojao je bug gdje je klik na poveznicu projekta unutar blog posta na engleskom jeziku usmjeravao na `/zh/projects/...` umjesto na ispravnu rutu bez prefiksa `/projects/...`.

**Glavni uzrok — dva povezana problema:**
1. Skripta za praćenje jezika u `BaseLayout.astro` resetirala je spremljeni jezik na `en` prilikom posjeta stranicama `/`, `/projects`, `/about` i `/contact` — no ruta `/blog` je nedostajala. Posjet lokaliziranoj stranici, a potom odlazak na `/blog/some-post` ostavio bi zastarjeli jezik u `localStorage`.
2. Alata za prepisivanje veza (link rewriter) u `BlogLayout.astro` čitao je ciljani jezik iz `localStorage` i `navigator.language` umjesto iz jezika stranice koji je Astro renderirao na poslužitelju — stoga su se veze prepisivale na temelju onog jezika koji je slučajno ostao u predmemoriji (cache).

**Rješenje:**
* Dodana je ruta `/blog` u uvjet za resetiranje preferiranog jezika unutar `BaseLayout.astro`.
* Prepisan je alat za prepisivanje veza koristeći `define:vars={{ pageLocale: locale }}` kako bi se Astro-renderirani jezik proslijedio izravno u inline klijentsku skriptu — čineći usmjeravanje potpuno determinističkim bez obzira na stanje preglednika.
* Isti popravak primijenjen je i na `ProjectLayout.astro` za unakrsne veze (cross-links) unutar stranica projekata.

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
          // prepiši /projects/... veze u /{locale}/projects/....
        }
      } catch {}
    })();
  </script>
```

Rute na engleskom jeziku ostaju bez prefiksa, kao što je konfigurirano pomoću `prefixDefaultLocale: false` u `astro.config.mjs`.

---

### 3. Pretraživanje putem palete naredbi bez pozadinskih krajnjih točaka (Zero-Endpoint)
Tema nije imala ugrađeno pretraživanje. Izgradio sam potpunu paletu naredbi bez ikakvih pozadinskih krajnjih točaka (endpoints) ili vanjskih biblioteka za pretraživanje.

**Kako radi:**
* **Statičko indeksiranje prilikom izgradnje:** Tijekom kompilacije (build time), Astrove funkcije za dohvaćanje prolaze kroz kolekcije sadržaja `blog` i `projects` te serijaliziraju rezultat kao ugrađeni (inline) JSON niz izravno unutar `SearchModal.astro` — bez HTTP zahtjeva u vremenu izvršavanja i bez vanjskih API-ja.
* **Mapiranje ruta:** Indekser uklanja jezične prefikse iz ID-jeva sadržaja kako bi se svaka stavka mapirala na jednu ispravnu rutu prilagođenu jeziku.
* **Približno podudaranje (Fuzzy Matching):** Približno podudaranje na strani klijenta u stvarnom vremenu ističe pronađene dijelove teksta umetanjem `<mark>` elemenata.
* **Interaktivnost tipkovnice:** Potpuno upravljanje tipkovnicom: `⌘K` ili `/` za otvaranje · `Esc` za zatvaranje · `↑`/`↓` za navigaciju · `Enter` za odlazak na stranicu.

*Gumb za pretraživanje integriran je u navigacijsku traku (navbar) i dostupan je na svakoj stranici na svim jezicima.*

---

### 4. Automatizirani proces za izračun vremena čitanja
Svaki blog post prikazuje izračunato vrijeme čitanja. Ovaj se proces pokreće tijekom kompilacije unutar rasporeda (layout) posta:
* Uklanja MDX/HTML oznake iz sirovog stabla sadržaja kako bi se izvukao čisti tekst.
* Izračunava vrijeme čitanja na temelju prosjeka od 200 riječi u minuti (WPM).
* Ako sadržaj tijela posta nije dostupan, sustav kao alternativu koristi broj riječi iz meta opisa (meta description) posta.
* Ispisuje lokalizirani tekst (npr. `3 min čitanja`) kroz aktivni i18n omotač.

---

### 5. Uklanjanje duplikata sadržaja na početnoj stranici
Budući da se sadržaj pohranjuje u MDX datotekama po jezicima (`blog/en/post.mdx`, `blog/de/post.mdx`, itd.), odjeljak s "najnovijim objavama" na početnoj stranici prikazivao je isti članak više puta — po jednom za svaku jezičnu varijantu, poredano prema datumu objave.

**Rješenje:** Upiti za sadržaj početne stranice sada su filtrirani tako da uključuju isključivo stavke iz kolekcije `en` prije odabira 3 najnovija posta i 4 najnovija projekta. To osigurava da se svaki dio sadržaja pojavi točno jednom, bez obzira na to koliko jezičnih datoteka za njega postoji.

---

### 6. Dinamički višejezični RSS sažeci (RSS feeds)
Zadani RSS sažetak prikazivao je sadržaj samo na engleskom jeziku na `/rss.xml`.

* **Što sam izradio:** Implementirao sam dinamičku rutu na `src/pages/[locale]/rss.xml.ts` koja dinamički generira RSS sažetke za sve konfigurirane lokalizacije (npr. `/hr/rss.xml`, `/es/rss.xml`).
* **Filtriranje sadržaja:** Sažeci automatski filtriraju blog zapise prema odgovarajućoj lokalizaciji i formatiraju poveznice s ispravnim jezičnim prefiksom (npr. `/hr/blog/...`).
* **XML prilagodba:** Sažeci ubacuju ispravan `<language>` kod (npr. `hr`, `zh-cn`, `es`) i dodaju naziv jezika naslovu sažetka (npr. *Luka Piplica (Hrvatski)*).
* **Automatsko otkrivanje (Auto-Discovery):** Prilagodio sam RSS poveznice u `BlogContent.astro`, `BlogLayout.astro` i oznaku `<link rel="alternate">` u `BaseLayout.astro` kako bi se dinamički mijenjale ovisno o aktivnom jeziku korisnika.

---

### 7. Dinamički strukturirani podaci za FAQ (JSON-LD)
Strukturirani podaci za Česta pitanja (FAQ) ključni su za optimizaciju za tražilice (SEO), ali fiksno kodirane (hardcoded) statične JSON datoteke shema ne podržavaju višejezični prijevod.

* **Što sam izradio:** Dinamički generiram **FAQPage** JSON-LD shemu u stvarnom vremenu unutar `AboutContent.astro` koristeći unose iz rječnika prijevoda (`aboutPage.faq.q1` do `q8` i odgovore).
* **Integracija:** Proširio sam `PageLayout.astro` kako bi prihvaćao `extraSchemas` svojstva (props) i prosljeđivao ih skripti za ubacivanje JSON-LD-a unutar `BaseLayout.astro`. To dinamički ugrađuje prevedene strukturirane podatke za FAQ na temelju aktivnog jezika (`/about`, `/hr/about`, itd.).

## 📁 Struktura projekta

```
src/
├── components/
│   ├── blog/
│   │   ├── ArticleHero.astro
│   │   ├── BlogCard.astro
│   │   ├── Comments.astro
│   │   ├── RelatedPosts.astro
│   │   ├── ShareButtons.astro         # Lokalizirana oznaka "Podijeli:"
│   │   └── TableOfContents.astro      # Lokalizirani naslov "Na ovoj stranici"
│   ├── effects/
│   │   ├── CursorTrail.astro
│   │   └── LetterGlitch.tsx
│   ├── layout/
│   │   ├── Header.astro               # Gumb za pretraživanje (desktop + mobitel)
│   │   ├── LanguageSwitcher.astro
│   │   ├── ThemeModeDropdown.astro    # Lokalizirane oznake načina rada (Sustav/Svijetlo/Tamno)
│   │   ├── ThemeSelector.astro        # Lokalizirani nazivi boja
│   │   └── ThemeSelectorDropdown.astro
│   ├── patterns/
│   │   ├── BlogContent.astro          # Zajednička komponenta indeksa bloga
│   │   ├── HomeContent.astro          # Početna stranica sa sadržajem filtriranim prema jeziku
│   │   └── ProjectsContent.astro
│   ├── projects/
│   │   ├── ProjectGallery.astro
│   │   ├── ProjectHero.astro
│   │   └── ProjectShowcase.astro
│   ├── search/
│   │   └── SearchModal.astro          # Paleta naredbi + interni indeks pri izgradnji
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
│   │   ├── en/                        # Engleski unosi (Izvor istine / Source of truth)
│   │   ├── hr/                        # Hrvatski prijevodi
│   │   ├── de/                        # Njemački prijevodi
│   │   ├── es/                        # Španjolski prijevodi
│   │   ├── ja/                        # Japanski prijevodi
│   │   └── zh/                        # Kineski prijevodi
│   └── projects/
│   │   ├── en/                        # Engleski projekti (Izvor istine)
│   │   ├── hr/ de/ es/ ja/ zh/        # Regionalne varijante prijevoda
│   │   └── ...
├── i18n/
│   ├── index.ts                       # t(), localizedPath() pomoćne funkcije (helpers)
│   ├── en.json
│   ├── hr.json
│   ├── de.json
│   ├── es.json
│   ├── ja.json
│   └── zh.json
├── layouts/
│   ├── BaseLayout.astro               # Globalno praćenje jezika + skripta za preferirani jezik
│   ├── BlogLayout.astro               # Deterministički alat za prepisivanje veza ovisno o jeziku
│   ├── PageLayout.astro
│   └── ProjectLayout.astro            # Primijenjen isti alat za prepisivanje veza
├── lib/
│   └── utils.ts                       # formatDate() uz Intl.DateTimeFormat jezičnu podršku
├── pages/
│   ├── index.astro                    # Početna stranica (i18n + filtar za sadržaj isključivo na engleskom)
│   ├── about.astro
│   ├── contact.astro
│   ├── blog/
│   │   ├── index.astro                # Popis blogova na engleskom (tanka ovojnica / thin wrapper)
│   │   └── [...slug].astro
│   ├── projects/
│   │   ├── index.astro
│   │   └── [slug].astro
│   ├── [locale]/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   ├── blog/
│   │   │   ├── index.astro            # Popis blogova s jezičnim prefiksom
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
│   ├── themes/                        # 13 tema boja (jantar, plava, cijan, ...)
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

## ⚙️ Početak rada

**Preduvjeti:** Node.js i pnpm

```bash
git clone https://github.com/lukapiplica/luka-piplica-portfolio
cd luka-piplica-portfolio
pnpm install
```

```bash
pnpm run dev    # pokretanje razvojnog poslužitelja s automatskim osvježavanjem (hot reload)
pnpm run build  # izgradnja projekta za produkciju (production build)
```

---

## 📁 Primjer lokalizacije

Rječnici prijevoda nalaze se u `src/i18n/*.json`. Komponente ih koriste putem pomoćne funkcije `t()`:

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

Ključevi rječnika podržavaju interpolaciju za dinamičke tekstualne nizove:

```json
{
  "search": {
    "placeholder": "Pretraži blogove i projekte...",
    "noResults": "Nema rezultata za \"{query}\"",
    "shortcutHint": "Esc za zatvaranje"
  },
  "blog": {
    "publishedOn": "Objavljeno {date}",
    "minRead": "min čitanja",
    "onThisPage": "Na ovoj stranici"
  }
}
```

---

## 👥 Zasluge

Izgrađeno na temelju [Astro Rocket](https://astro.build/themes/details/astro-rocket/) teme autora [hansmartensdev](https://github.com/hansmartensdev/Astro-Rocket). Izvornu temu pružio je vizualni sustav dizajna i temeljne komponente — sve što je navedeno u ovoj README datoteci izgrađeno je po mjeri povrh toga.