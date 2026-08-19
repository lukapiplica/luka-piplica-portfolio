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

  const jsVars: Record<string, string> = {};
  cleaned = cleaned.replace(
    /export\s+const\s+([a-zA-Z0-9_$]+)\s*=\s*(`[\s\S]*?`|'[\s\S]*?'|"[\s\S]*?");?/g,
    (_: string, varName: string, rawVal: string) => {
      let val = rawVal.trim();
      if (val.startsWith('`') && val.endsWith('`')) {
        val = val.slice(1, -1);
      } else if (
        (val.startsWith("'") && val.endsWith("'")) ||
        (val.startsWith('"') && val.endsWith('"'))
      ) {
        val = val.slice(1, -1);
        val = val
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\\\/g, '\\');
      }
      jsVars[varName] = val;
      return '';
    }
  );

  cleaned = cleaned.replace(/^export\s+[\s\S]*?;?\s*$/gm, '');

  const codeBlocks: string[] = [];
  cleaned = cleaned.replace(
    /<CodeBlock\s+([\s\S]*?)(?:\/>|>\s*<\/CodeBlock>)/g,
    (_: string, attrs: string) => {
      let codeText = '';
      const varRefMatch = attrs.match(/code=\{([a-zA-Z0-9_$]+)\}/);
      if (varRefMatch && varRefMatch[1] in jsVars) {
        codeText = jsVars[varRefMatch[1]];
      } else {
        const tmplMatch = attrs.match(/code=\{`([\s\S]*?)`\}/);
        if (tmplMatch) {
          codeText = tmplMatch[1];
        } else {
          const strMatch = attrs.match(/code=["']([\s\S]*?)["']/);
          if (strMatch) {
            codeText = strMatch[1];
          }
        }
      }

      let filename = '';
      const fnMatch = attrs.match(/filename=(?:["']([^"']+)["']|\{["']([^"']+)["']\})/);
      if (fnMatch) {
        filename = fnMatch[1] || fnMatch[2] || '';
      }

      let lang = 'c';
      if (filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext) {
          const extMap: Record<string, string> = {
            c: 'c',
            h: 'c',
            cpp: 'cpp',
            hpp: 'cpp',
            cc: 'cpp',
            cxx: 'cpp',
            js: 'javascript',
            mjs: 'javascript',
            cjs: 'javascript',
            ts: 'typescript',
            mts: 'typescript',
            cts: 'typescript',
            py: 'python',
            sh: 'bash',
            bash: 'bash',
            json: 'json',
            css: 'css',
            scss: 'scss',
            html: 'html',
            xml: 'xml',
            astro: 'astro',
            jsx: 'jsx',
            tsx: 'tsx',
            rs: 'rust',
            go: 'go',
          };
          lang = extMap[ext] || ext;
        }
      }

      const headerHtml = filename
        ? `<div class="rss-code-header" style="font-family: monospace; font-size: 0.85em; font-weight: 600; padding: 6px 12px; background: rgba(150, 150, 150, 0.15); border: 1px solid rgba(150, 150, 150, 0.2); border-bottom: none; border-radius: 6px 6px 0 0; color: inherit; display: block;">${escapeXml(filename)}</div>`
        : '';

      const borderRadius = filename ? '0 0 6px 6px' : '6px';

      const codeHtml = `<pre style="margin: 0; padding: 12px; background: rgba(150, 150, 150, 0.08); border: 1px solid rgba(150, 150, 150, 0.2); border-radius: ${borderRadius}; overflow-x: auto; font-family: monospace; font-size: 0.9em; line-height: 1.45;"><code class="language-${lang}">${escapeXml(codeText)}</code></pre>`;

      const index = codeBlocks.length;
      codeBlocks.push(
        `<div class="rss-code-wrapper" style="margin: 1.25em 0;">\n${headerHtml}\n${codeHtml}\n</div>`
      );

      return `\n\nRSSCODEBLOCKPLACEHOLDER${index}END\n\n`;
    }
  );

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

  codeBlocks.forEach((blockHtml, index) => {
    const placeholderRegex = new RegExp(
      `<p>\\s*RSSCODEBLOCKPLACEHOLDER${index}END\\s*<\\/p>|RSSCODEBLOCKPLACEHOLDER${index}END`,
      'g'
    );
    html = html.replace(placeholderRegex, blockHtml);
  });

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
