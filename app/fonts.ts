import { Inter, Merriweather } from 'next/font/google';

/**
 * All UI fonts are self-hosted by Next.js (no runtime requests to fonts.googleapis.com).
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/fonts
 */

/** Primary UI — Latin + extended Latin (e.g. `es`) via a single next/font pipeline. */
export const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
  adjustFontFallback: true,
  weight: ['400', '500', '600', '700'],
});

/**
 * Display / headings (`font-serif`). `preload: false` avoids competing with Inter on first paint;
 * glyphs load when serif headings render.
 */
export const merriweather = Merriweather({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-merriweather',
  adjustFontFallback: true,
  preload: false,
});

export const fontBodyClassNames = `${inter.className} ${inter.variable} ${merriweather.variable}`;
