/**
 * Merges pre-translated blog post content into hi.json and es.json.
 * Usage: node scripts/merge-blog-translations.mjs [path-to-translations.json]
 * Default path: scripts/blog-content-translations.json
 * JSON shape: { "hi": { "slug": "html content", ... }, "es": { "slug": "html content", ... } }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, '../messages');
const DEFAULT_TRANSLATIONS = path.join(__dirname, 'blog-content-translations.json');

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function setPostContent(data, slug, content) {
  if (!data.Blog) data.Blog = {};
  if (!data.Blog.posts) data.Blog.posts = {};
  if (!data.Blog.posts[slug]) data.Blog.posts[slug] = {};
  data.Blog.posts[slug].content = content;
}

function main() {
  const translationsPath = process.argv[2] || DEFAULT_TRANSLATIONS;
  if (!fs.existsSync(translationsPath)) {
    console.error('Translations file not found:', translationsPath);
    process.exit(1);
  }
  const translations = loadJSON(translationsPath);
  for (const locale of ['hi', 'es']) {
    const bySlug = translations[locale];
    if (!bySlug || typeof bySlug !== 'object') continue;
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    let data = {};
    try {
      data = loadJSON(filePath);
    } catch (e) {
      console.warn(`Could not load ${locale}.json:`, e.message);
      continue;
    }
    let count = 0;
    for (const [slug, content] of Object.entries(bySlug)) {
      if (typeof content !== 'string') continue;
      setPostContent(data, slug, content);
      count++;
    }
    saveJSON(filePath, data);
    console.log(`${locale}.json: merged ${count} post(s).`);
  }
  console.log('Done.');
}

main();
