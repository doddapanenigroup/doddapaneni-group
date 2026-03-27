import { NextResponse } from 'next/server';

/**
 * AdSense / ads.txt — set `ADSENSE_PUBLISHER_ID` to the numeric part only (no `pub-` prefix)
 * or full `pub-xxxxxxxxxxxxxxxx` after your account is approved.
 * @see https://support.google.com/adsense/answer/7532444
 */
export function GET() {
  const raw = process.env.ADSENSE_PUBLISHER_ID?.trim() ?? '';
  const id = raw.replace(/^pub-/i, '');
  const body = id
    ? `google.com, pub-${id}, DIRECT, f08c47fec0942fa0\n`
    : `# After AdSense approval, set ADSENSE_PUBLISHER_ID in the server environment (numeric ID).\n`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
