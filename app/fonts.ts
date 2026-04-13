import { Inter, Merriweather } from 'next/font/google';

/**
 * All UI fonts are self-hosted by Next.js (no runtime requests to fonts.googleapis.com).
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/fonts
 */

/**
 * Primary UI — variable Inter = one woff2. `latin` only keeps the file smaller than `latin+latin-ext`
 * (helps GTmetrix “critical request chain” / font bytes). Indic copy uses system UI fonts via CSS fallbacks.
 * Re-add `latin-ext` if you need Polish/Czech/etc. in Latin script.
 */
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
  adjustFontFallback: true,
});

/**
 * Display / headings (`font-serif`). `preload: false` avoids competing with Inter on first paint.
 */
export const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-merriweather',
  adjustFontFallback: true,
  preload: false,
});

export const fontBodyClassNames = `${inter.className} ${inter.variable} ${merriweather.variable}`;
