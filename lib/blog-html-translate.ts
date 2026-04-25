import { translateText } from '@/lib/translate';

type HtmlSegment =
  | { type: 'html'; value: string }
  | { type: 'text'; tag: string; attrs: string; value: string };

/**
 * Split HTML into segments; only simple blocks (no nested tags inside) are translated.
 * Matches scripts/translate-blog-content.mjs behaviour, with a few extra tags.
 */
export function parseHtmlSegments(html: string): HtmlSegment[] {
  const segments: HtmlSegment[] = [];
  const re = /<(p|h1|h2|h3|h4|li)([^>]*)>([^<]*)<\/\1>/gi;
  let lastEnd = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m.index > lastEnd) {
      segments.push({ type: 'html', value: html.slice(lastEnd, m.index) });
    }
    segments.push({
      type: 'text',
      tag: m[1].toLowerCase(),
      attrs: m[2],
      value: m[3],
    });
    lastEnd = re.lastIndex;
  }
  if (lastEnd < html.length) {
    segments.push({ type: 'html', value: html.slice(lastEnd) });
  }
  return segments;
}

export function buildHtmlFromSegments(segments: HtmlSegment[], translatedTexts: string[]): string {
  let out = '';
  let i = 0;
  for (const seg of segments) {
    if (seg.type === 'html') {
      out += seg.value;
    } else {
      out += `<${seg.tag}${seg.attrs}>${translatedTexts[i++] ?? seg.value}</${seg.tag}>`;
    }
  }
  return out;
}

/**
 * Translates inner text of simple block tags; preserves HTML structure.
 */
export async function translateHtmlContent(
  html: string,
  targetLocale: string,
  sourceLocale: string,
): Promise<string> {
  const trimmed = html.trim();
  if (!trimmed) return html;
  const hasAngleTag = /<[a-z?/!]/i.test(trimmed);
  if (!hasAngleTag) {
    return translateText(trimmed, targetLocale, sourceLocale);
  }

  // Translate text nodes between tags so rich/nested HTML keeps structure while all visible content is translated.
  const parts = trimmed.split(/(<[^>]+>)/g);
  const translatedParts = await Promise.all(
    parts.map(async (part) => {
      if (!part) return part;
      if (part.startsWith('<') && part.endsWith('>')) return part;
      if (!part.trim()) return part;
      try {
        return await translateText(part, targetLocale, sourceLocale);
      } catch {
        return part;
      }
    }),
  );
  return translatedParts.join('');
}
