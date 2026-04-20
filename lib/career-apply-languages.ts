/** Spoken languages candidates may report for careers (subset of site locales for UI copy). */
export const CAREER_SPOKEN_LANGUAGE_CODES = ['en', 'te', 'hi'] as const;
export type CareerSpokenLanguageCode = (typeof CAREER_SPOKEN_LANGUAGE_CODES)[number];

const ALLOWED = new Set<string>(CAREER_SPOKEN_LANGUAGE_CODES);

/** Dashboard labels (English). */
export const CAREER_SPOKEN_LANGUAGE_LABELS: Record<CareerSpokenLanguageCode, string> = {
  en: 'English',
  te: 'Telugu',
  hi: 'Hindi',
};

const DEFAULT_CSV = CAREER_SPOKEN_LANGUAGE_CODES.join(',');

export function parseApplyLanguageCodesCsv(csv: string | null | undefined): CareerSpokenLanguageCode[] {
  const raw = (csv ?? '')
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const picked = new Set<string>();
  for (const c of raw) {
    if (ALLOWED.has(c)) picked.add(c);
  }
  const ordered = CAREER_SPOKEN_LANGUAGE_CODES.filter((c) => picked.has(c));
  return ordered.length ? (ordered as CareerSpokenLanguageCode[]) : [...CAREER_SPOKEN_LANGUAGE_CODES];
}

/** Join selected codes for storage. Returns empty string if none valid (caller should reject). */
export function toApplyLanguageCodesCsv(codes: readonly string[] | null | undefined): string {
  if (!codes?.length) return '';
  const picked = new Set<string>();
  for (const c of codes) {
    const x = String(c).trim().toLowerCase();
    if (ALLOWED.has(x)) picked.add(x);
  }
  const ordered = CAREER_SPOKEN_LANGUAGE_CODES.filter((c) => picked.has(c));
  return ordered.join(',');
}

export function normalizeLanguagesKnownForJob(
  selected: string[],
  jobAllowed: CareerSpokenLanguageCode[],
): CareerSpokenLanguageCode[] {
  const allow = new Set<string>(jobAllowed);
  const out: CareerSpokenLanguageCode[] = [];
  for (const c of selected) {
    const x = String(c).trim().toLowerCase();
    if (!ALLOWED.has(x) || !allow.has(x)) continue;
    if (!out.includes(x as CareerSpokenLanguageCode)) out.push(x as CareerSpokenLanguageCode);
  }
  return out;
}
