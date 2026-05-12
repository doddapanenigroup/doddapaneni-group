/**
 * Translates all messages from en to target locales (UI strings only).
 * Skips Blog.posts.*.content (use translate-blog-content.mjs for that).
 * Run from project root: node scripts/translate-all-locales.mjs
 *
 * npm shortcuts (after editing messages/en.json, run i18n:content-sync):
 *   npm run i18n:translate-sectors   — sector landings (IT/AI, marketing, healthcare, construction)
 *   npm run i18n:translate-forms     — CompanyForms, DivisionTopics
 *   npm run i18n:translate-legal     — Privacy, Terms, Disclaimer
 *   npm run i18n:translate-pages     — Team, Contact, About, Home, Careers, DealsMedi
 *   npm run i18n:translate           — all keys (very long; use TRANSLATE_ONLY_PREFIXES to narrow)
 * Env:
 *   TRANSLATE_DELAY_MS=500 (default)
 *   TRANSLATE_LOCALES=te,hi (optional, only these)
 *   TRANSLATE_ONLY_PREFIXES=SoftwareItAiSector,DigitalMarketingSector (optional; dot-path prefixes)
 *   TRANSLATE_ENGINE=lingva (default) | mymemory — Lingva is a Google Translate front-end and avoids MyMemory 429s.
 *   LINGVA_BASE=https://lingva.ml (optional mirror)
 * If you see HTTP 429 on mymemory, switch to lingva or set TRANSLATE_DELAY_MS=2000.
 * When ENGINE=lingva, MyMemory is used automatically if Lingva fails after retries (keeps hi/es runs from stalling).
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, '../messages');
const SOURCE = 'en';
const TARGET_LOCALES = ['te', 'hi', 'es'];
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const LINGVA_BASE = (process.env.LINGVA_BASE || 'https://lingva.ml').replace(/\/$/, '');
const TRANSLATE_ENGINE = (process.env.TRANSLATE_ENGINE || 'lingva').toLowerCase();
const MAX_CHUNK_BYTES = 350;
const DELAY_MS = Number(process.env.TRANSLATE_DELAY_MS) || 500;

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getLeafKeys(obj, prefix = '') {
  const entries = [];
  if (obj === null || obj === undefined) return entries;
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [key, val] of Object.entries(obj)) {
      const p = prefix ? `${prefix}.${key}` : key;
      if (typeof val === 'string') {
        entries.push({ path: p, value: val });
      } else if (typeof val === 'object' && val !== null) {
        entries.push(...getLeafKeys(val, p));
      }
    }
  }
  return entries;
}

function getNestedKey(obj, pathStr) {
  let current = obj;
  for (const key of pathStr.split('.')) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[key];
  }
  return typeof current === 'string' ? current : undefined;
}

function setNestedKey(obj, pathStr, value) {
  const parts = pathStr.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }
  current[parts[parts.length - 1]] = value;
}

function chunkText(text, maxBytes) {
  const chunks = [];
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

async function translateTextLingva(text, targetLocale, sourceLocale = SOURCE) {
  const t = text.trim();
  if (!t) return text;
  if (targetLocale === sourceLocale) return text;
  const chunks = chunkText(t, MAX_CHUNK_BYTES);
  const out = [];
  for (const chunk of chunks) {
    const pathSeg = encodeURIComponent(chunk);
    const url = `${LINGVA_BASE}/api/v1/${sourceLocale}/${targetLocale}/${pathSeg}`;
    let lastErr;
    const maxAttempts = 8;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const res = await fetch(url, {signal: AbortSignal.timeout(45_000)});
      if (res.ok) {
        const data = await res.json();
        const translated = data?.translation;
        out.push(typeof translated === 'string' ? translated : chunk);
        break;
      }
      lastErr = new Error(`HTTP ${res.status}`);
      if ((res.status === 429 || res.status === 503) && attempt < maxAttempts - 1) {
        const backoff = Math.min(90_000, 4000 * 2 ** attempt);
        console.warn(`  Lingva ${res.status}, waiting ${Math.round(backoff / 1000)}s...`);
        await delay(backoff);
      } else {
        throw lastErr;
      }
    }
    await delay(DELAY_MS);
  }
  return out.join(chunks.length > 1 ? ' ' : '');
}

async function translateTextMymemory(text, targetLocale, sourceLocale = SOURCE) {
  const t = text.trim();
  if (!t) return text;
  if (targetLocale === sourceLocale) return text;
  const langpair = `${sourceLocale}|${targetLocale}`;
  const chunks = chunkText(t, MAX_CHUNK_BYTES);
  const out = [];
  for (const chunk of chunks) {
    const url = `${MYMEMORY_URL}?q=${encodeURIComponent(chunk)}&langpair=${encodeURIComponent(langpair)}`;
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(url, {signal: AbortSignal.timeout(45_000)});
      if (res.ok) {
        const data = await res.json();
        const translated = data?.responseData?.translatedText;
        out.push(typeof translated === 'string' ? translated : chunk);
        break;
      }
      lastErr = new Error(`HTTP ${res.status}`);
      if (res.status === 429 && attempt < 2) {
        const backoff = (attempt + 1) * 8000;
        console.warn(`  Rate limited (429), waiting ${backoff / 1000}s...`);
        await delay(backoff);
      } else {
        throw lastErr;
      }
    }
    await delay(DELAY_MS);
  }
  return out.join(chunks.length > 1 ? ' ' : '');
}

async function translateText(text, targetLocale, sourceLocale = SOURCE) {
  if (TRANSLATE_ENGINE === 'mymemory') {
    return translateTextMymemory(text, targetLocale, sourceLocale);
  }
  try {
    return await translateTextLingva(text, targetLocale, sourceLocale);
  } catch (err) {
    console.warn(`  Lingva failed (${err.message}); trying MyMemory fallback…`);
    return translateTextMymemory(text, targetLocale, sourceLocale);
  }
}

function shouldSkipKey(keyPath, value) {
  if (!/^Blog\.posts\.[^.]+\.content$/.test(keyPath)) return false;
  return value.includes('<');
}

async function main() {
  const onlyLocales = process.env.TRANSLATE_LOCALES
    ? process.env.TRANSLATE_LOCALES.split(',').map((s) => s.trim()).filter(Boolean)
    : null;
  const locales = onlyLocales && onlyLocales.length > 0
    ? TARGET_LOCALES.filter((l) => onlyLocales.includes(l))
    : TARGET_LOCALES;

  const onlyPrefixes = process.env.TRANSLATE_ONLY_PREFIXES
    ? process.env.TRANSLATE_ONLY_PREFIXES.split(',').map((s) => s.trim()).filter(Boolean)
    : null;

  console.log('Loading en.json...');
  const enData = loadJSON(path.join(MESSAGES_DIR, `${SOURCE}.json`));
  const leaves = getLeafKeys(enData);
  let toTranslate = leaves.filter(({ path: p, value: v }) => !shouldSkipKey(p, v));
  if (onlyPrefixes && onlyPrefixes.length > 0) {
    toTranslate = toTranslate.filter(({ path: p }) =>
      onlyPrefixes.some((pref) => p === pref || p.startsWith(`${pref}.`)),
    );
    console.log(`Filter TRANSLATE_ONLY_PREFIXES: ${onlyPrefixes.join(', ')} → ${toTranslate.length} keys`);
  }
  console.log(`Total keys: ${leaves.length}, skipping blog HTML content: ${leaves.length - toTranslate.length}`);
  console.log(
    `Engine: ${TRANSLATE_ENGINE}${TRANSLATE_ENGINE === 'lingva' ? ` (${LINGVA_BASE})` : ''}\nTranslating to: ${locales.join(', ')} (delay ${DELAY_MS}ms)\n`,
  );

  for (const locale of locales) {
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    let data = {};
    try {
      data = loadJSON(filePath);
    } catch {
      console.warn(`No ${locale}.json, creating from en.`);
    }
    let translated = 0;
    let skipped = 0;
    for (const { path: keyPath, value: enValue } of toTranslate) {
      const existing = getNestedKey(data, keyPath);
      if (existing !== undefined && existing !== enValue) {
        skipped++;
        continue;
      }
      if (enValue.trim() === '') {
        setNestedKey(data, keyPath, '');
        skipped++;
        continue;
      }
      try {
        const translatedValue = await translateText(enValue, locale, SOURCE);
        setNestedKey(data, keyPath, translatedValue);
        translated++;
        if (translated % 10 === 0) {
          console.log(`  ${locale}: ${translated} strings…`);
          saveJSON(filePath, data);
        }
      } catch (err) {
        console.error(`  ${locale} ${keyPath}: ${err.message}`);
        setNestedKey(data, keyPath, enValue);
      }
    }
    saveJSON(filePath, data);
    console.log(`${locale}.json: ${translated} translated, ${skipped} skipped.`);
  }

  const root = path.join(__dirname, '..');
  const syncScript = path.join(__dirname, 'sync-content-translations.mjs');
  console.log('\nSyncing content/translations from messages (app reads these bundles)…');
  const syncResult = spawnSync(process.execPath, [syncScript], { stdio: 'inherit', cwd: root });
  if (syncResult.status !== 0) {
    console.error('sync-content-translations.mjs failed; run: node scripts/sync-content-translations.mjs');
    process.exit(syncResult.status ?? 1);
  }

  console.log('\nDone. Run node scripts/translate-blog-content.mjs to translate blog post bodies.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
