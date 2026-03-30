import { delay, translateText } from '@/lib/translate';

const DELAY_MS = Number(process.env.TRANSLATE_DELAY_MS) || 400;

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

  const segments = parseHtmlSegments(trimmed);
  const textSegments = segments.filter((s): s is Extract<HtmlSegment, { type: 'text' }> => s.type === 'text');
  if (textSegments.length === 0) {
    const plain = trimmed.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plain) return trimmed;
    return translateText(plain, targetLocale, sourceLocale);
  }

  const translated: string[] = [];
  for (const seg of textSegments) {
    const t = await translateText(seg.value, targetLocale, sourceLocale);
    translated.push(t);
    await delay(DELAY_MS);
  }
  return buildHtmlFromSegments(segments, translated);
}
