/**
 * Translates Blog.posts.<slug>.content from en to te, hi, es.
 * Preserves HTML structure by translating only the text inside <p> and <h2> tags.
 * Run from project root: node scripts/translate-blog-content.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, '../messages');
const SOURCE = 'en';
const ALL_LOCALES = ['te', 'hi', 'es'];
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
// Use TRANSLATE_DELAY_MS=6000 to reduce 429; or pass --locales hi,es to translate only hi+es
const DELAY_MS = Number(process.env.TRANSLATE_DELAY_MS) || 3500;

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateText(text, targetLocale, sourceLocale = 'en') {
  const t = text.trim();
  if (!t) return text;
  if (targetLocale === sourceLocale) return text;
  const langpair = `${sourceLocale}|${targetLocale}`;
  const url = `${MYMEMORY_URL}?q=${encodeURIComponent(t)}&langpair=${encodeURIComponent(langpair)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  return typeof translated === 'string' ? translated : text;
}

/**
 * Split HTML into segments: [ { type: 'html'|'text', value }, ... ]
 * Only <p>...</p> and <h2>...</h2> inner text is translated; tags are preserved.
 */
function parseHtmlSegments(html) {
  const segments = [];
  const re = /<(p|h2)([^>]*)>([^<]*)<\/\1>/gi;
  let lastEnd = 0;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m.index > lastEnd) {
      segments.push({ type: 'html', value: html.slice(lastEnd, m.index) });
    }
    segments.push({
      type: 'text',
      tag: m[1].toLowerCase(),
      attrs: m[2],
      value: m[3],
    });
    lastEnd = re.lastIndex;
  }
  if (lastEnd < html.length) {
    segments.push({ type: 'html', value: html.slice(lastEnd) });
  }
  return segments;
}

function buildHtmlFromSegments(segments, translatedTexts) {
  let out = '';
  let i = 0;
  for (const seg of segments) {
    if (seg.type === 'html') {
      out += seg.value;
    } else {
      out += `<${seg.tag}${seg.attrs}>${translatedTexts[i++] ?? seg.value}</${seg.tag}>`;
    }
  }
  return out;
}

async function translateContent(html, targetLocale) {
  const segments = parseHtmlSegments(html);
  const textSegments = segments.filter((s) => s.type === 'text');
  if (textSegments.length === 0) return html;
  const translated = [];
  for (const seg of textSegments) {
    const t = await translateText(seg.value, targetLocale, SOURCE);
    translated.push(t);
    await delay(DELAY_MS);
  }
  return buildHtmlFromSegments(segments, translated);
}

function getPosts(data) {
  return data?.Blog?.posts ?? {};
}

function setPostContent(data, slug, content) {
  if (!data.Blog) data.Blog = {};
  if (!data.Blog.posts) data.Blog.posts = {};
  if (!data.Blog.posts[slug]) data.Blog.posts[slug] = {};
  data.Blog.posts[slug].content = content;
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const onlySlug = args[0] || null;
  const localesArg = process.argv.find((a) => a.startsWith('--locales='));
  const TARGET_LOCALES =
    localesArg ? localesArg.split('=')[1].split(',').map((s) => s.trim()) : ALL_LOCALES;

  console.log('Loading en.json...');
  const enData = loadJSON(path.join(MESSAGES_DIR, `${SOURCE}.json`));
  const enPosts = getPosts(enData);
  let slugs = Object.keys(enPosts);
  if (onlySlug) {
    if (!enPosts[onlySlug]) {
      console.error(`Slug "${onlySlug}" not found in en.json`);
      process.exit(1);
    }
    slugs = [onlySlug];
    console.log(`Translating single post: ${onlySlug} for ${TARGET_LOCALES.join(', ')}...`);
  } else {
    console.log(`Found ${slugs.length} blog posts. Translating content for ${TARGET_LOCALES.join(', ')}...`);
  }
  console.log(`Delay between API calls: ${DELAY_MS}ms`);

  for (const locale of TARGET_LOCALES) {
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    let localeData = {};
    try {
      localeData = loadJSON(filePath);
    } catch {
      console.warn(`No ${locale}.json, skipping.`);
      continue;
    }
    if (!localeData.Blog) localeData.Blog = {};
    if (!localeData.Blog.posts) localeData.Blog.posts = {};

    console.log(`\n--- ${locale} ---`);
    for (const slug of slugs) {
      const enContent = enPosts[slug]?.content;
      if (typeof enContent !== 'string' || !enContent.trim()) {
        setPostContent(localeData, slug, enContent || '');
        continue;
      }
      const existing = localeData.Blog?.posts?.[slug]?.content;
      // Skip if already translated (content differs from English)
      if (typeof existing === 'string' && existing !== enContent) {
        console.log(`  ${slug} (skip: already translated)`);
        continue;
      }
      try {
        const translated = await translateContent(enContent, locale);
        setPostContent(localeData, slug, translated);
        console.log(`  ${slug}`);
      } catch (err) {
        console.error(`  ${slug} error:`, err.message);
        setPostContent(localeData, slug, enContent);
      }
    }
    saveJSON(filePath, localeData);
    console.log(`Saved ${locale}.json`);
  }
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
