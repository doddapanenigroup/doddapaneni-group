/**
 * Fails the build if translation key trees differ across locales.
 * Run: node scripts/validate-translation-coverage.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, '..', 'content', 'translations');
const LOCALES = ['en', 'te', 'hi', 'es'];

function leafPaths(obj, prefix = '') {
  const out = new Set();
  if (obj === null || obj === undefined) return out;
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    out.add(prefix || '<root>');
    return out;
  }
  const keys = Object.keys(obj);
  if (keys.length === 0) {
    out.add(prefix || '<empty>');
    return out;
  }
  for (const k of keys) {
    const p = prefix ? `${prefix}.${k}` : k;
    const sub = leafPaths(obj[k], p);
    for (const s of sub) out.add(s);
  }
  return out;
}

function main() {
  const trees = {};
  for (const loc of LOCALES) {
    const fp = path.join(DIR, `${loc}.json`);
    if (!fs.existsSync(fp)) {
      console.error(`Missing ${fp}. Run: node scripts/sync-content-translations.mjs`);
      process.exit(1);
    }
    trees[loc] = leafPaths(JSON.parse(fs.readFileSync(fp, 'utf8')));
  }
  const ref = trees.en;
  let ok = true;
  for (const loc of LOCALES) {
    if (loc === 'en') continue;
    const missing = [...ref].filter((k) => !trees[loc].has(k));
    const extra = [...trees[loc]].filter((k) => !ref.has(k));
    if (missing.length || extra.length) {
      ok = false;
      console.error(`\nLocale "${loc}" differs from en:`);
      if (missing.length) console.error(`  Missing (${missing.length}):`, missing.slice(0, 40).join('\n  '), missing.length > 40 ? '\n  …' : '');
      if (extra.length) console.error(`  Extra (${extra.length}):`, extra.slice(0, 40).join('\n  '), extra.length > 40 ? '\n  …' : '');
    }
  }
  if (!ok) {
    console.error('\nTranslation coverage validation failed.');
    process.exit(1);
  }
  console.log('Translation coverage OK (all locales share the same key tree).');
}

main();
