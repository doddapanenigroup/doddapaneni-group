/**
 * Normalizes marketer-authored blog bodies for public HTML rendering.
 * - Real HTML (p, headings, lists, etc.) is passed through unchanged.
 * - Common markdown-style lines (# headings, **bold**, - lists) become HTML.
 * - Plain text gains <p> / <br /> so newlines are not collapsed into one block.
 */

const STRUCTURED_HTML =
  /<\s*\/?\s*(p|h[1-6]|div|ul|ol|li|section|article|blockquote|br|strong|b|em|i|a|table|thead|tbody|tr|td|th|pre|code|figure|img|span|hr)\b/i;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Inline **bold** and *italic* after escaping other text. */
function inlineFormat(text: string): string {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts
    .map((part) => {
      const bold = part.match(/^\*\*([^*]+)\*\*$/);
      if (bold) return `<strong>${escapeHtml(bold[1])}</strong>`;
      const em = part.match(/^\*([^*]+)\*$/);
      if (em) return `<em>${escapeHtml(em[1])}</em>`;
      return escapeHtml(part);
    })
    .join('');
}

function plainTextToHtml(s: string): string {
  const t = s.trim();
  if (!t) return '';
  return t
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split('\n').map((line) => escapeHtml(line.replace(/\s+$/, '')));
      const inner = lines.join('<br />\n');
      return `<p>${inner}</p>`;
    })
    .join('\n');
}

function isProbablyMarkdown(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (/^#{1,6}\s/m.test(t)) return true;
  if (/\*\*[^*\n]+\*\*/.test(t)) return true;
  if (/^\s*[-*]\s+\S/m.test(t)) return true;
  return false;
}

function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const chunks: string[] = [];
  let listOpen = false;

  const flushList = () => {
    if (listOpen) {
      chunks.push('</ul>');
      listOpen = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const t = line.trim();
    if (!t) {
      flushList();
      continue;
    }

    const hm = t.match(/^(#{1,6})\s+(.+)$/);
    if (hm) {
      flushList();
      const level = hm[1].length;
      const inner = inlineFormat(hm[2]);
      chunks.push(`<h${level}>${inner}</h${level}>`);
      continue;
    }

    if (/^[-*]\s+/.test(t)) {
      if (!listOpen) {
        chunks.push('<ul>');
        listOpen = true;
      }
      chunks.push(`<li>${inlineFormat(t.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }

    flushList();
    chunks.push(`<p>${inlineFormat(t)}</p>`);
  }
  flushList();
  return chunks.join('\n');
}

/**
 * Returns safe-ish HTML for `dangerouslySetInnerHTML` (trusted marketer content).
 */
/** True when the string already looks like HTML (any common tag open), so we do not escape it. */
function looksLikeAnyHtml(s: string): boolean {
  if (STRUCTURED_HTML.test(s)) return true;
  return /<\s*[a-z!?\/][\s\S]*?>/i.test(s);
}

export function prepareBlogBodyHtml(raw: string | null | undefined): string {
  const s = (raw ?? '').trim();
  if (!s) return '';
  if (looksLikeAnyHtml(s)) return s;
  if (isProbablyMarkdown(s)) return markdownToHtml(s);
  return plainTextToHtml(s);
}
