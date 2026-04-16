import { Open_Sans, Poppins } from 'next/font/google';

/**
 * Self-hosted via Next.js (no runtime requests to fonts.googleapis.com in the browser).
 * Heading: Poppins · Body: Open Sans (corporate / readable).
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/fonts
 */

export const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
  adjustFontFallback: true,
  preload: false,
});

export const openSans = Open_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-open-sans',
  adjustFontFallback: true,
  preload: true,
});

/** Applied on `<html>` / `<body>`: body face + CSS variables for Tailwind `font-sans` / `font-serif`. */
export const fontBodyClassNames = `${openSans.className} ${openSans.variable} ${poppins.variable}`;
