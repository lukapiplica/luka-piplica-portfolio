import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import siteConfig from '@/config/site.config';
import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
});

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
 * Wraps content in CDATA block, escaping any internal ]]> sequences
 */
function wrapCdata(content: string): string {
  return `<![CDATA[${content.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

/**
 * Renders post body Markdown into clean HTML for RSS feeds
 */
async function renderPostContent(post: any, siteUrl: string): Promise<string> {
  const rawBody = post.body || '';

  // 1. Remove MDX import statements (e.g. import { Alert } from '...')
  let cleaned = rawBody.replace(/^import\s+[\s\S]*?;?\s*$/gm, '');

  // 2. Convert custom MDX components like <Alert variant="...">content</Alert>
  cleaned = cleaned.replace(
    /<Alert(?:\s+variant="([^"]+)")?>([\s\S]*?)<\/Alert>/g,
    (_: string, variant: string = 'info', content: string) => {
      const label = variant.toUpperCase();
      return `\n\n> **[${label}]**\n> ${content.trim().replace(/\n/g, '\n> ')}\n\n`;
    }
  );

  // 3. Render Markdown to HTML
  let html = (await marked.parse(cleaned)) as string;

  // 4. Prepend featured image if available
  if (post.data.image) {
    const imgSrc =
      typeof post.data.image === 'object' && post.data.image?.src
        ? post.data.image.src
        : String(post.data.image);

    let fullImgUrl = imgSrc;
    if (!imgSrc.startsWith('http')) {
      const cleanPath = imgSrc.startsWith('/') ? imgSrc : `/${imgSrc}`;
      fullImgUrl = `${siteUrl}${cleanPath}`;
    }

    const altText = escapeXml(post.data.imageAlt || post.data.title);
    html = `<p><img src="${fullImgUrl}" alt="${altText}" /></p>\n` + html;
  }

  return html;
}

export async function GET(context: APIContext) {
  // Get only English, non-draft posts for RSS
  const posts = await getCollection('blog', ({ data }) =>
    data.locale === 'en' && !data.draft
  );

  // Sort posts by date (newest first)
  const sortedPosts = posts.sort(
    (a, b) => new Date(b.data.publishedAt).getTime() - new Date(a.data.publishedAt).getTime()
  );

  // Generate slug from post id (remove 'en/' prefix)
  const getSlug = (id: string) => id.replace('en/', '');

  const site = context.site?.toString() ?? siteConfig.url;
  const siteUrl = site.endsWith('/') ? site.slice(0, -1) : site;

  const itemsList = await Promise.all(
    sortedPosts.map(async (post) => {
      const link = `${siteUrl}/blog/${getSlug(post.id)}/`;
      const categories = post.data.tags
        .map((tag) => `<category>${escapeXml(tag)}</category>`)
        .join('\n        ');

      const contentHtml = await renderPostContent(post, siteUrl);

      return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(post.data.description)}</description>
      <content:encoded>${wrapCdata(contentHtml)}</content:encoded>
      <pubDate>${formatRfc822Date(post.data.publishedAt)}</pubDate>
      <dc:creator>${escapeXml(post.data.author)}</dc:creator>
      ${categories}
    </item>`;
    })
  );

  const items = itemsList.join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <description>${escapeXml(siteConfig.description)}</description>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
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

