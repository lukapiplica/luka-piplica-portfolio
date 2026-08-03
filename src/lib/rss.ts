
import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
});

const imageModules = import.meta.glob<{ default: { src?: string } | string }>(
  '/src/assets/**/*.{png,jpg,jpeg,webp,svg,gif}',
  { eager: true }
);

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function formatRfc822Date(date: Date): string {
  return date.toUTCString();
}

export function wrapCdata(content: string): string {
  return `<![CDATA[${content.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

export function resolveImageUrl(rawSrc: string, siteUrl: string): string {
  if (!rawSrc) return rawSrc;

  if (rawSrc.startsWith('http://') || rawSrc.startsWith('https://')) {
    return rawSrc;
  }

  const cleanPath = rawSrc
    .replace(/^(\.\.\/)+/, '')
    .replace(/^@\//, '')
    .replace(/^\//, '');

  const assetKey = cleanPath.startsWith('src/assets/')
    ? `/${cleanPath}`
    : cleanPath.startsWith('assets/')
      ? `/src/${cleanPath}`
      : null;

  if (assetKey && imageModules[assetKey]) {
    const mod = imageModules[assetKey];
    const resolvedSrc =
      typeof mod === 'object' && mod !== null && 'default' in mod
        ? typeof mod.default === 'object' && mod.default !== null && 'src' in mod.default
          ? (mod.default as { src: string }).src
          : String(mod.default)
        : String(mod);

    const cleanResolvedSrc = resolvedSrc.startsWith('/') ? resolvedSrc : `/${resolvedSrc}`;
    return `${siteUrl}${cleanResolvedSrc}`;
  }

  const rootPath = rawSrc.startsWith('/') ? rawSrc : `/${rawSrc}`;
  return `${siteUrl}${rootPath}`;
}

export async function renderPostContent(post: any, siteUrl: string): Promise<string> {
  let cleaned = post.body || '';

  cleaned = cleaned.replace(/^import\s+[\s\S]*?;?\s*$/gm, '');

  cleaned = cleaned.replace(
    /<Alert(?:\s+variant="([^"]+)")?>([\s\S]*?)<\/Alert>/g,
    (_: string, variant: string = 'info', content: string) => {
      const label = variant.toUpperCase();
      return `\n\n> **[${label}]**\n> ${content.trim().replace(/\n/g, '\n> ')}\n\n`;
    }
  );


  cleaned = cleaned.replace(/\$\$\s*([\s\S]+?)\s*\$\$/g, (_: string, math: string) => {
    const trimmed = math.trim();
    const encoded = encodeURIComponent(`\\dpi{150} ${trimmed}`);
    const alt = escapeXml(trimmed);
    return `\n\n<div style="text-align: center; margin: 1.5em 0;">\n<img src="https://latex.codecogs.com/png.image?${encoded}" alt="${alt}" style="max-width: 100%; height: auto;" />\n</div>\n\n`;
  });

  cleaned = cleaned.replace(/(?<!\\|\$)\$([^\$\n]+?)(?<!\\|\$)\$/g, (_: string, math: string) => {
    const trimmed = math.trim();
    const encoded = encodeURIComponent(`\\dpi{150} ${trimmed}`);
    const alt = escapeXml(trimmed);
    return `<img src="https://latex.codecogs.com/png.image?${encoded}" alt="${alt}" style="vertical-align: middle; max-width: 100%; height: auto;" />`;
  });

  let html = (await marked.parse(cleaned)) as string;

  html = html.replace(/<img([^>]+)src=["']([^"']+)["']/gi, (_match: string, p1: string, p2: string) => {
    const resolvedUrl = resolveImageUrl(p2, siteUrl);
    return `<img${p1}src="${resolvedUrl}"`;
  });

  if (post.data.image) {
    const imgSrc =
      typeof post.data.image === 'object' && post.data.image?.src
        ? post.data.image.src
        : String(post.data.image);

    const fullImgUrl = resolveImageUrl(imgSrc, siteUrl);
    const altText = escapeXml(post.data.imageAlt || post.data.title);
    html = `<p><img src="${fullImgUrl}" alt="${altText}" /></p>\n` + html;
  }

  return html;
}
