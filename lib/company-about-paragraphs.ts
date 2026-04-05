/** Split stored about text into paragraphs (blank-line separated). */
export function parseAboutParagraphs(raw: string | null | undefined): string[] {
  const s = raw?.trim();
  if (!s) return [];
  return s
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
}
