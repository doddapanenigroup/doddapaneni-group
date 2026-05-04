/**
 * Detect pasted plain text that looks like a bullet or numbered list and convert it
 * to minimal HTML that TipTap's StarterKit can parse (ul/ol + li + p).
 */

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Leading bullet / number marker; capture body after it. */
const BULLET_LINE = /^\s*[-*+•·]\s+(.+)$/u;
const ORDERED_LINE = /^\s*\d{1,3}[.)]\s+(.+)$/u;

export function plainTextPasteToListHtml(text: string): string | null {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trimEnd();
  if (!normalized.trim()) return null;

  const rawLines = normalized.split('\n');
  type Row = { kind: 'bullet' | 'ordered'; body: string };
  const rows: Row[] = [];
  let mode: 'bullet' | 'ordered' | null = null;

  for (const line of rawLines) {
    if (!line.trim()) continue;

    let m = line.match(BULLET_LINE);
    if (m) {
      const body = (m[1] ?? '').trimEnd();
      if (mode === null) mode = 'bullet';
      if (mode !== 'bullet') return null;
      rows.push({ kind: 'bullet', body });
      continue;
    }

    m = line.match(ORDERED_LINE);
    if (m) {
      const body = (m[1] ?? '').trimEnd();
      if (mode === null) mode = 'ordered';
      if (mode !== 'ordered') return null;
      rows.push({ kind: 'ordered', body });
      continue;
    }

    return null;
  }

  if (!mode || rows.length < 2) return null;

  const items = rows.map((r) => escapeHtmlText(r.body));

  if (mode === 'bullet') {
    return `<ul>${items.map((c) => `<li><p>${c}</p></li>`).join('')}</ul>`;
  }
  return `<ol>${items.map((c) => `<li><p>${c}</p></li>`).join('')}</ol>`;
}
