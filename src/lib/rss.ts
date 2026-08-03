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

export function latexToHtml(latex: string, isBlock: boolean = false): string {
  let s = latex.trim();

  s = s.replace(/\\text\{([^}]+)\}/g, '$1');
  s = s.replace(/\\mathrm\{([^}]+)\}/g, '$1');
  s = s.replace(/\\mathbf\{([^}]+)\}/g, '<b>$1</b>');

  s = s.replace(/\\vec\{([^}]+)\}/g, '$1\u20D7');
  s = s.replace(/\\hat\{([^}]+)\}/g, '$1\u0302');
  s = s.replace(/\\bar\{([^}]+)\}/g, '$1\u0304');

  s = s.replace(/\\underbrace\{\s*([\s\S]+?)\s*\}_\{\s*([\s\S]+?)\s*\}/g, '$1 [$2]');

  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');

  s = s.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');

  s = s.replace(/\\lVert\s*([\s\S]+?)\s*\\rVert/g, '||$1||');
  s = s.replace(/\\\|\s*([\s\S]+?)\s*\\\|/g, '||$1||');
  s = s.replace(/\\left\|/g, '|').replace(/\\right\|/g, '|');
  s = s.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
  s = s.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']');

  s = s.replace(/\\cdot/g, '·');
  s = s.replace(/\\times/g, '×');
  s = s.replace(/\\approx/g, '≈');
  s = s.replace(/\\le/g, '≤');
  s = s.replace(/\\ge/g, '≥');
  s = s.replace(/\\neq/g, '≠');
  s = s.replace(/\\pm/g, '±');
  s = s.replace(/\\infty/g, '∞');
  s = s.replace(/\\sum/g, '∑');
  s = s.replace(/\\prod/g, '∏');
  s = s.replace(/\\int/g, '∫');
  s = s.replace(/\\alpha/g, 'α');
  s = s.replace(/\\beta/g, 'β');
  s = s.replace(/\\gamma/g, 'γ');
  s = s.replace(/\\delta/g, 'δ');
  s = s.replace(/\\epsilon/g, 'ε');
  s = s.replace(/\\theta/g, 'θ');
  s = s.replace(/\\lambda/g, 'λ');
  s = s.replace(/\\mu/g, 'μ');
  s = s.replace(/\\pi/g, 'π');
  s = s.replace(/\\sigma/g, 'σ');
  s = s.replace(/\\phi/g, 'φ');
  s = s.replace(/\\omega/g, 'ω');
  s = s.replace(/\\Delta/g, 'Δ');
  s = s.replace(/\\Sigma/g, 'Σ');
  s = s.replace(/\\cos/g, 'cos');
  s = s.replace(/\\sin/g, 'sin');
  s = s.replace(/\\tan/g, 'tan');
  s = s.replace(/\\log/g, 'log');
  s = s.replace(/\\ln/g, 'ln');
  s = s.replace(/\\min/g, 'min');
  s = s.replace(/\\max/g, 'max');

  s = s.replace(/_\{([^}]+)\}/g, '<sub>$1</sub>');
  s = s.replace(/_([a-zA-Z0-9])/g, '<sub>$1</sub>');

  s = s.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
  s = s.replace(/\^([a-zA-Z0-9])/g, '<sup>$1</sup>');

  s = s.replace(/\\,/g, ' ');
  s = s.replace(/\\/g, '');
  s = s.replace(/\s+/g, ' ').trim();

  if (isBlock) {
    return `\n\n<div class="rss-math-block" style="text-align: center; margin: 1.2em 0; padding: 0.8em; background: rgba(150, 150, 150, 0.08); border-left: 3px solid #666; font-family: 'Cambria Math', 'Times New Roman', serif; font-size: 1.1em; line-height: 1.5; overflow-x: auto;">\n<strong>${s}</strong>\n</div>\n\n`;
  } else {
    return `<span class="rss-math-inline" style="font-family: 'Cambria Math', 'Times New Roman', serif; font-size: 1.05em; padding: 0 2px;">${s}</span>`;
  }
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
    return latexToHtml(math, true);
  });

  cleaned = cleaned.replace(/(?<!\\|\$)\$([^\$\n]+?)(?<!\\|\$)\$/g, (_: string, math: string) => {
    return latexToHtml(math, false);
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
