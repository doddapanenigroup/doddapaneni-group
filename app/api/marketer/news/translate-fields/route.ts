import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { allowMarketerModule } from '@/app/api/marketer/_permissions';
import { captureErrorToDb } from '@/lib/error-monitor';
import { machineTranslateCanonicalFields, translationTargetLocales } from '@/lib/blog-translations-sync';

export const maxDuration = 120;

function strOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length ? t : null;
}

/**
 * Machine-translate canonical (English) blog fields for the create flow before a row exists.
 * Returns per-locale title/content/meta/html for the marketer form; does not write to the database.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(await allowMarketerModule(session.user.role as any, 'blogs'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (process.env.BLOG_AUTO_TRANSLATE === '0') {
      return NextResponse.json(
        { message: 'Auto-translate is off (BLOG_AUTO_TRANSLATE=0).' },
        { status: 400 },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const content = typeof body.content === 'string' ? body.content : '';
    if (!title || !content.trim()) {
      return NextResponse.json({ message: 'title and content are required' }, { status: 400 });
    }

    const locales = await machineTranslateCanonicalFields({
      title,
      content,
      excerpt: strOrNull(body.excerpt),
      metaTitle: strOrNull(body.metaTitle),
      metaDescription: strOrNull(body.metaDescription),
      ogTitle: strOrNull(body.ogTitle),
      ogDescription: strOrNull(body.ogDescription),
    });

    const targets = translationTargetLocales();
    const okLocales = Object.keys(locales);
    const failedLocales = targets.filter((l) => !okLocales.includes(l));
    return NextResponse.json({
      ok: true,
      locales,
      failedLocales,
      message:
        failedLocales.length > 0
          ? `Translated: ${okLocales.join(', ') || 'none'}. Failed: ${failedLocales.join(', ')}. Save to persist successful locales.`
          : `Translated to: ${targets.join(', ')}. Save the post to persist these rows.`,
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'marketer/blog/translate-fields/POST',
      user: null,
    });
    console.error('Marketer translate-fields error:', error);
    return NextResponse.json(
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? { message: 'Server error', debug: error.message }
        : { message: 'Server error' },
      { status: 500 },
    );
  }
}
