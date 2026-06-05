import { getCollection } from 'astro:content';
import type { APIContext, GetStaticPaths } from 'astro';
import siteConfig from '@/config/site.config';
import i18nConfig from '@/config/i18n.config';

/**
 * Escapes XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Formats a date to RFC-822 format for RSS
 */
function formatRfc822Date(date: Date): string {
  return date.toUTCString();
}

/**
 * Map locale codes to RSS <language> values (BCP 47 / RFC 5646).
 */
const localeToLanguage: Record<string, string> = {
  en: 'en-us',
  de: 'de',
  ja: 'ja',
  es: 'es',
  zh: 'zh-cn',
  hr: 'hr',
};

/**
 * Generate static paths for every configured locale.
 * Matches the pattern used by other pages in [locale]/.
 * The default locale (en) also has a root-level /rss.xml endpoint.
 */
export const getStaticPaths: GetStaticPaths = () => {
  return i18nConfig.locales.map((locale) => ({ params: { locale } }));
};

export async function GET(context: APIContext) {
  const locale = context.params.locale as string;

  // Get non-draft posts for the requested locale
  const posts = await getCollection('blog', ({ data }) =>
    data.locale === locale && !data.draft
  );

  // Sort posts by date (newest first)
  const sortedPosts = posts.sort(
    (a, b) => new Date(b.data.publishedAt).getTime() - new Date(a.data.publishedAt).getTime()
  );

  // Generate slug from post id (remove locale prefix)
  const getSlug = (id: string) => id.replace(`${locale}/`, '');

  const site = context.site?.toString() ?? siteConfig.url;
  const siteUrl = site.endsWith('/') ? site.slice(0, -1) : site;

  const feedTitle = `${siteConfig.name} (${i18nConfig.localeNames?.[locale] ?? locale})`;
  const language = localeToLanguage[locale] ?? locale;

  const items = sortedPosts
    .map((post) => {
      const link = `${siteUrl}/${locale}/blog/${getSlug(post.id)}/`;
      const categories = post.data.tags
        .map((tag) => `<category>${escapeXml(tag)}</category>`)
        .join('\n        ');

      return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <description>${escapeXml(post.data.description)}</description>
      <pubDate>${formatRfc822Date(post.data.publishedAt)}</pubDate>
      <author>${escapeXml(post.data.author)}</author>
      ${categories}
    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <description>${escapeXml(siteConfig.description)}</description>
    <link>${siteUrl}/${locale}</link>
    <atom:link href="${siteUrl}/${locale}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>${language}</language>
    <lastBuildDate>${formatRfc822Date(new Date())}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
