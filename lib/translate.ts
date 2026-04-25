/**
 * Free translation using MyMemory API (no API key required).
 * https://mymemory.translated.net/doc/spec.php
 * Limit: ~500 bytes per request; daily limit without key. Uses chunking for long text.
 */

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const GOOGLE_FREE_URL = 'https://translate.googleapis.com/translate_a/single';
const SOURCE_LOCALE = 'en';
const MAX_CHUNK_BYTES = 400;

function encodeUriComponentSafe(str: string): string {
  return encodeURIComponent(str);
}

function chunkText(text: string, maxBytes: number): string[] {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (Buffer.byteLength(remaining, 'utf8') <= maxBytes) {
      chunks.push(remaining);
      break;
    }
    let split = remaining.slice(0, Math.ceil(maxBytes / 2));
    const lastSpace = split.lastIndexOf(' ');
    if (lastSpace > maxBytes / 3) split = split.slice(0, lastSpace + 1);
    chunks.push(split);
    remaining = remaining.slice(split.length);
  }
  return chunks;
}

export async function translateText(
  text: string,
  targetLocale: string,
  sourceLocale: string = SOURCE_LOCALE
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (targetLocale === sourceLocale) return text;

  const langpair = `${sourceLocale}|${targetLocale}`;
  const chunks = chunkText(trimmed, MAX_CHUNK_BYTES);
  const translated: string[] = [];

  const requestTimeoutMs = Number(process.env.TRANSLATE_FETCH_TIMEOUT_MS) || 20_000;

  const retryMax = Math.max(1, Number(process.env.TRANSLATE_MAX_RETRIES) || 3);
  const delayMs = Math.max(0, Number(process.env.TRANSLATE_DELAY_MS) || 250);

  for (const chunk of chunks) {
    const url = `${MYMEMORY_URL}?q=${encodeUriComponentSafe(chunk)}&langpair=${encodeURIComponent(langpair)}`;
    let translatedChunk: string | null = null;

    for (let attempt = 1; attempt <= retryMax; attempt += 1) {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), requestTimeoutMs);
      try {
        translatedChunk = await tryMyMemory(chunk, url, controller.signal);
        break;
      } catch (e) {
        if (attempt >= retryMax) {
          // Fallback provider for reliability (especially when MyMemory rate-limits).
          try {
            translatedChunk = await tryGoogleFree(chunk, targetLocale, sourceLocale);
            break;
          } catch (fallbackErr) {
            if (e instanceof Error && e.name === 'AbortError') {
              throw new Error('Translation request timed out (providers slow or unreachable)');
            }
            if (fallbackErr instanceof Error && fallbackErr.message) {
              throw new Error(fallbackErr.message);
            }
            throw e;
          }
        }
        await delay(delayMs * attempt);
      } finally {
        clearTimeout(t);
      }
    }
    if (translatedChunk == null) translatedChunk = chunk;
    translated.push(translatedChunk);
    if (delayMs > 0) await delay(delayMs);
  }

  return translated.join(chunks.length > 1 ? ' ' : '');
}

async function tryMyMemory(chunk: string, url: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(url, { method: 'GET', signal });
  if (!res.ok) {
    throw new Error(`Translation failed (${res.status})`);
  }
  const data = (await res.json()) as { responseData?: { translatedText?: string }; responseStatus?: number };
  const status = data?.responseStatus;
  if (typeof status === 'number' && status === 429) {
    throw new Error('Translation rate limited (429).');
  }
  return typeof data?.responseData?.translatedText === 'string' ? data.responseData.translatedText : chunk;
}

async function tryGoogleFree(
  chunk: string,
  targetLocale: string,
  sourceLocale: string
): Promise<string> {
  const url =
    `${GOOGLE_FREE_URL}?client=gtx&sl=${encodeURIComponent(sourceLocale)}&tl=${encodeURIComponent(targetLocale)}` +
    `&dt=t&q=${encodeUriComponentSafe(chunk)}`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Fallback translation failed (${res.status})`);
  }
  const payload = (await res.json()) as unknown;
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    return chunk;
  }
  const rows = payload[0] as unknown[];
  const out = rows
    .map((r) => (Array.isArray(r) && typeof r[0] === 'string' ? r[0] : ''))
    .join('');
  return out || chunk;
}

/**
 * Delay helper to avoid rate limits.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
