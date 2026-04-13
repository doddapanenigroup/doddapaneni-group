/**
 * Builds /content/translations/{en,te,hi,es}.json from messages/*.json plus shared JSON.
 * Run from repo root: node scripts/sync-content-translations.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MESSAGES = path.join(ROOT, 'messages');
const OUT = path.join(ROOT, 'content', 'translations');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function isPlainObject(x) {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/** Same semantics as lib/i18n-merge-messages.ts */
function mergeLocaleOntoEnglish(english, localeMessages) {
  const out = {};
  const keys = new Set([...Object.keys(english), ...Object.keys(localeMessages)]);
  for (const key of keys) {
    const e = english[key];
    const l = localeMessages[key];
    if (l === undefined) {
      out[key] = e;
      continue;
    }
    if (e === undefined) {
      out[key] = l;
      continue;
    }
    if (isPlainObject(e) && isPlainObject(l)) {
      out[key] = mergeLocaleOntoEnglish(e, l);
    } else {
      out[key] = l;
    }
  }
  return out;
}

function main() {
  const divisionTopics = readJson(path.join(MESSAGES, 'division-topics.json'));
  const companyForms = readJson(path.join(MESSAGES, 'company-forms.json'));
  const en = readJson(path.join(MESSAGES, 'en.json'));

  const locales = ['en', 'te', 'hi', 'es'];
  fs.mkdirSync(OUT, { recursive: true });

  for (const loc of locales) {
    const base =
      loc === 'en' ? structuredClone(en) : mergeLocaleOntoEnglish(en, readJson(path.join(MESSAGES, `${loc}.json`)));
    const merged = {
      ...base,
      DivisionTopics: divisionTopics,
      CompanyForms: companyForms,
    };
    fs.writeFileSync(path.join(OUT, `${loc}.json`), JSON.stringify(merged, null, 2) + '\n');
  }
  console.log(`Wrote ${locales.length} files to ${path.relative(ROOT, OUT)}`);
}

main();
