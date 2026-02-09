import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { translateText, delay } from '@/lib/translate';
import { getLeafKeys, getNestedKey, setNestedKey } from '@/lib/i18n-sync';

const SOURCE_LOCALE = 'en';
const TARGET_LOCALES = [
  'te', 'hi', 'es',
  'bn', 'mr', 'ta', 'gu', 'ur', 'kn', 'or', 'ml', 'pa', 'as', 'mai', 'sat', 'ks',
];
const DELAY_MS = Number(process.env.TRANSLATE_DELAY_MS) || 500;

/** Skip translating long HTML blog content here; use scripts/translate-blog-content.mjs to preserve structure. */
function shouldSkipKey(keyPath: string, value: string): boolean {
  if (!/^Blog\.posts\.[^.]+\.content$/.test(keyPath)) return false;
  return value.includes('<');
}

export type TranslateAllResult = {
  locale: string;
  translated: number;
  skipped: number;
  errors: string[];
};

export async function runTranslateAll(): Promise<{
  ok: boolean;
  source: string;
  results: TranslateAllResult[];
}> {
  const messagesDir = path.join(process.cwd(), 'messages');
  const enPath = path.join(messagesDir, `${SOURCE_LOCALE}.json`);
  const enRaw = await readFile(enPath, 'utf-8');
  const enData = JSON.parse(enRaw) as Record<string, unknown>;
  const enLeaves = getLeafKeys(enData);
  const results: TranslateAllResult[] = [];

  for (const locale of TARGET_LOCALES) {
    const localePath = path.join(messagesDir, `${locale}.json`);
    let targetData: Record<string, unknown> = {};
    try {
      const raw = await readFile(localePath, 'utf-8');
      targetData = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      targetData = {};
    }

    let translated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const { path: keyPath, value: enValue } of enLeaves) {
      if (shouldSkipKey(keyPath, enValue)) {
        skipped++;
        continue;
      }
      const existing = getNestedKey(targetData, keyPath);
      if (existing !== undefined && existing !== enValue) {
        skipped++;
        continue;
      }
      if (enValue.trim() === '') {
        setNestedKey(targetData, keyPath, '');
        skipped++;
        continue;
      }
      try {
        const translatedValue = await translateText(enValue, locale, SOURCE_LOCALE);
        setNestedKey(targetData, keyPath, translatedValue);
        translated++;
        await delay(DELAY_MS);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${keyPath}: ${msg}`);
        setNestedKey(targetData, keyPath, enValue);
      }
    }

    await writeFile(localePath, JSON.stringify(targetData, null, 2) + '\n', 'utf-8');
    results.push({ locale, translated, skipped, errors });
  }

  return { ok: true, source: SOURCE_LOCALE, results };
}
