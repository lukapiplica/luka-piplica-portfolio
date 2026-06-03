# Luka Piplica — Portafolio y Blog Técnico

<p align="left">
  <a href="./README.md">🇺🇸 English</a> │
  <a href="./README.hr.md">🇭🇷 Hrvatski</a> │
  <a href="./README.es.md">🇪🇸 Español</a> │
  <a href="./README.de.md">🇩🇪 Deutsch</a> │
  <a href="./README.ja.md">🇯🇵 日本語</a> │
  <a href="./README.zh.md">🇨🇳 中文</a>
</p>

Un portafolio personal y base de conocimientos técnicos de alto rendimiento y completamente localizado, construido con Astro, TypeScript y Tailwind CSS. Cubre operaciones de TI empresariales, infraestructura de red, diagnóstico de hardware y securización (hardening) de sistemas.

Desarrollado sobre el tema Astro Rocket, con el motor de enrutamiento, el sistema i18n, la capa de búsqueda y las canalizaciones (pipelines) de contenido completamente rediseñados desde cero.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Notas |
| :--- | :--- | :--- |
| **Framework** | Astro | SSG con Content Collections |
| **Estilos** | Tailwind CSS | Tokens de diseño semánticos |
| **Lenguaje** | TypeScript | Esquemas estrictos en todas las colecciones |
| **Datos estructurados** | Schema.org / `schema-dts` | Integración con JSON-LD |

---

## 🚀 Qué He Construido

El tema base proporcionaba los componentes de diseño y un enrutamiento básico. Todo lo que se detalla a continuación fue diseñado e implementado desde cero sobre esa base.

### 1. Sistema i18n completo — 6 idiomas, cada ruta
El tema tenía hooks de i18n como marcadores de posición (placeholders), pero carecía de datos de traducción reales, no tenía enrutamiento con prefijo de idioma para `/blog` ni una forma sistemática de manejar cadenas dinámicas.

* **Qué construí:** Añadí rutas con prefijo de idioma para `/blog` y `/[...slug]` siguiendo el patrón existente de `/projects`, creando los archivos `[locale]/blog/index.astro`, `[locale]/blog/[...slug].astro` y un componente compartido `BlogContent.astro`.
* **Cobertura de localización:** Rellené los 6 archivos de idioma (`en`, `hr`, `de`, `es`, `ja`, `zh`) con claves de traducción para cada cadena de la interfaz de usuario: metadatos del artículo (etiqueta de compartir, tiempo de lectura, "En esta página", fechas), etiquetas de navegación, cadenas de búsqueda y controles del tema (modo, color, etiquetas de sistema/claro/oscuro).
* **Formato adaptable al idioma:** Implementé el formato de fecha adaptado a cada idioma local mediante `Intl.DateTimeFormat` para que las fechas se rendericen correctamente según el idioma (por ejemplo, *19 de mayo de 2026* en español).
* **Interpolación de cadenas dinámicas:** Desarrollé interpolación de cadenas basada en expresiones regulares (regex) dentro de los componentes para plantillas de texto contextuales como `Publicado el {date}` o `No se encontraron resultados para "{query}"`.
* **Localización de desplegables:** Localicé por completo `ThemeModeDropdown`, `ThemeSelectorDropdown` y `ThemeSelector`, incluyendo los nombres de los colores y las etiquetas de los modos.

> **Idiomas soportados:** Inglés (por defecto, sin prefijo) · Croata `/hr` · Alemán `/de` · Español `/es` · Japonés `/ja` · Chino `/zh`

### 2. Enrutamiento de enlaces determinista y adaptable al idioma
Existía un error por el cual, al hacer clic en el enlace de un proyecto desde una publicación de blog en inglés, se redirigía a `/zh/projects/...` en lugar de a la ruta correcta sin prefijo `/projects/...`.

**Causa raíz — dos problemas actuando juntos:**
1. El script de seguimiento de idioma en `BaseLayout.astro` restablecía el idioma guardado a `en` al visitar `/`, `/projects`, `/about` y `/contact`, pero faltaba `/blog`. Visitar una página localizada y luego ir a `/blog/some-post` dejaba un idioma obsoleto en el `localStorage`.
2. El reescribidor de enlaces en `BlogLayout.astro` leía el idioma de destino desde el `localStorage` y desde `navigator.language` en lugar de hacerlo desde el idioma de la página renderizada por el servidor de Astro, por lo que los enlaces se reescribían en función de cualquier idioma que estuviera almacenado en la caché.

**La Solución:**
* Se añadió `/blog` a la condición de restablecimiento del idioma preferido en `BaseLayout.astro`.
* Se reescribió el reescribidor de enlaces utilizando `define:vars={{ pageLocale: locale }}` para pasar el idioma renderizado por Astro directamente al script en línea del cliente, logrando que el enrutamiento sea completamente determinista independientemente del estado del navegador.
* Se aplicó la misma solución a `ProjectLayout.astro` para los enlaces cruzados dentro de las páginas de proyectos.

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
          // reescribir enlaces de /projects/... a /{locale}/projects/...
        }
      } catch {}
    })();
  </script>
```

Las rutas en inglés permanecen sin prefijo, tal como está configurado con `prefixDefaultLocale: false` en `astro.config.mjs`.

---

### 3. Paleta de comandos de búsqueda sin endpoints (Zero-Endpoint)
El tema no incluía ninguna función de búsqueda. Construí una paleta de comandos completa sin endpoints en el backend ni librerías de búsqueda externas.

**Cómo funciona:**
* **Indexación estática en tiempo de compilación:** Al compilar, los capturadores (fetchers) de Astro consultan las colecciones de contenido de `blog` y `projects` y serializan el resultado como un array JSON en línea incrustado directamente dentro de `SearchModal.astro` — sin peticiones HTTP en tiempo de ejecución ni APIs externas.
* **Mapeo de rutas:** El indexador elimina los prefijos de idioma de los IDs de contenido para que cada entrada apunte a una única ruta correcta y adaptada al idioma.
* **Búsqueda difusa (Fuzzy Matching):** La coincidencia difusa en el lado del cliente resalta las subcadenas coincidentes inyectando elementos `<mark>` en tiempo real.
* **Interactividad del teclado:** Controlado totalmente por teclado: `⌘K` o `/` para abrir · `Esc` para cerrar · `↑`/`↓` para navegar · `Enter` para acceder.

*El botón de búsqueda está integrado en la barra de navegación (navbar) y se encuentra disponible en todas las páginas de todos los idiomas.*

---

### 4. Pipeline automatizado de tiempo de lectura
Cada publicación del blog muestra un tiempo de lectura calculado. El pipeline se ejecuta en tiempo de compilación dentro del diseño de la publicación:
* Elimina el marcado MDX/HTML del árbol de contenido sin procesar para extraer texto plano.
* Calcula el tiempo de lectura sobre una base de 200 palabras por minuto (WPM).
* Utiliza el recuento de palabras de la meta descripción de la publicación como alternativa (fallback) si el contenido del cuerpo no está disponible.
* Devuelve una cadena localizada (por ejemplo, `3 min read` / `Lectura de 3 min`) a través del contenedor i18n activo.

---

### 5. Deduplicación de contenido en la página de inicio
Debido a que el contenido se almacena en archivos MDX por idioma (`blog/en/post.mdx`, `blog/de/post.mdx`, etc.), la sección de "últimas publicaciones" de la página de inicio mostraba el mismo artículo varias veces (una por cada variante de idioma), ordenadas por fecha de publicación.

**La Solución:** Las consultas de contenido de la página de inicio ahora se filtran para incluir únicamente las entradas de la colección `en` antes de seleccionar las 3 publicaciones y los 4 proyectos más recientes. Esto asegura que cada pieza de contenido aparezca exactamente una vez, independientemente de cuántos archivos de idioma existan para ella.

---

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── blog/
│   │   ├── ArticleHero.astro
│   │   ├── BlogCard.astro
│   │   ├── Comments.astro
│   │   ├── RelatedPosts.astro
│   │   ├── ShareButtons.astro         # Etiqueta localizada de "Compartir:"
│   │   └── TableOfContents.astro      # Encabezado localizado de "En esta página"
│   ├── effects/
│   │   ├── CursorTrail.astro
│   │   └── LetterGlitch.tsx
│   ├── layout/
│   │   ├── Header.astro               # Botón de búsqueda (escritorio + móvil)
│   │   ├── LanguageSwitcher.astro
│   │   ├── ThemeModeDropdown.astro    # Etiquetas de modo localizadas (Sistema/Claro/Oscuro)
│   │   ├── ThemeSelector.astro        # Nombres de colores localizados
│   │   └── ThemeSelectorDropdown.astro
│   ├── patterns/
│   │   ├── BlogContent.astro          # Componente compartido de índice de blog
│   │   ├── HomeContent.astro          # Página de inicio con contenido filtrado por idioma
│   │   └── ProjectsContent.astro
│   ├── projects/
│   │   ├── ProjectGallery.astro
│   │   ├── ProjectHero.astro
│   │   └── ProjectShowcase.astro
│   ├── search/
│   │   └── SearchModal.astro          # Paleta de comandos + índice interno en tiempo de compilación
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
│   │   ├── en/                        # Entradas en inglés (Fuente de verdad)
│   │   ├── hr/                        # Traducciones al croata
│   │   ├── de/                        # Traducciones al alemán
│   │   ├── es/                        # Traducciones al español
│   │   ├── ja/                        # Traducciones al japonés
│   │   └── zh/                        # Traducciones al chino
│   └── projects/
│   │   ├── en/                        # Proyectos en inglés (Fuente de verdad)
│   │   ├── hr/ de/ es/ ja/ zh/        # Variantes de traducción regionales
│   │   └── ...
├── i18n/
│   ├── index.ts                       # Helpers t(), localizedPath()
│   ├── en.json
│   ├── hr.json
│   ├── de.json
│   ├── es.json
│   ├── ja.json
│   └── zh.json
├── layouts/
│   ├── BaseLayout.astro               # Seguimiento global de idioma + script de idioma preferido
│   ├── BlogLayout.astro               # Reescribidor de enlaces determinista y adaptable al idioma
│   ├── PageLayout.astro
│   └── ProjectLayout.astro            # Se aplica el mismo reescribidor de enlaces
├── lib/
│   └── utils.ts                       # formatDate() con soporte de idioma de Intl.DateTimeFormat
├── pages/
│   ├── index.astro                    # Página de inicio (i18n + filtro de contenido solo en inglés)
│   ├── about.astro
│   ├── contact.astro
│   ├── blog/
│   │   ├── index.astro                # Listado de blog en inglés (envoltura delgada / thin wrapper)
│   │   └── [...slug].astro
│   ├── projects/
│   │   ├── index.astro
│   │   └── [slug].astro
│   ├── [locale]/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   ├── blog/
│   │   │   ├── index.astro            # Listado de blog con prefijo de idioma
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
│   ├── themes/                        # 13 temas de color (ámbar, azul, cian, ...)
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

## ⚙️ Primeros Pasos

**Prerrequisitos:** Node.js y pnpm

```bash
git clone https://github.com/lukapiplica/luka-piplica-portfolio
cd luka-piplica-portfolio
pnpm install
```

```bash
pnpm run dev    # iniciar el servidor de desarrollo con hot reload
pnpm run build  # compilación para producción (production build)
```

---

## 📁 Ejemplo de Localización

Los diccionarios de traducción residen en `src/i18n/*.json`. Los componentes los consumen a través del helper `t()`:

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

Las claves del diccionario admiten interpolación para cadenas dinámicas:

```json
{
  "search": {
    "placeholder": "Buscar blogs y proyectos...",
    "noResults": "No se encontraron resultados para \"{query}\"",
    "shortcutHint": "Esc para cerrar"
  },
  "blog": {
    "publishedOn": "Publicado el {date}",
    "minRead": "min de lectura",
    "onThisPage": "En esta página"
  }
}
```

---

## 👥 Créditos

Desarrollado sobre el tema [Astro Rocket](https://astro.build/themes/details/astro-rocket/) de [hansmartensdev](https://github.com/hansmartensdev/Astro-Rocket). El tema original proporcionó el sistema de diseño visual y las bases de los componentes; todo lo que se enumera en este README fue construido a medida sobre esa base.