import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { allowMarketerModule } from '@/app/api/marketer/_permissions';
import { captureErrorToDb } from '@/lib/error-monitor';
import { translateBlogPostByIdForMarketer, translationTargetLocales } from '@/lib/blog-translations-sync';

export const maxDuration = 300;

/**
 * Runs machine translation from the canonical (default locale) post into all other app locales.
 * Works for draft or published rows; public site uses translations when the post is published.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(await allowMarketerModule(session.user.role as any, 'blogs'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { slug } = await params;
    const s = slug.trim();
    if (!s) return NextResponse.json({ message: 'Invalid slug' }, { status: 400 });

    await connectDb();
    const row = await prisma.news.findUnique({
      where: { slug: s },
      select: { id: true },
    });
    if (!row) return NextResponse.json({ message: 'News article not found' }, { status: 404 });

    const result = await translateBlogPostByIdForMarketer(row.id);
    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }

    const targets = translationTargetLocales();
    return NextResponse.json({
      ok: true,
      locales: targets,
      message: `Translated to: ${targets.join(', ')}. Visitors see these when the post is published and they use that language.`,
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'marketer/blog/translate-locales/POST',
      user: null,
    });
    console.error('Marketer translate-locales error:', error);
    return NextResponse.json(
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? { message: 'Server error', debug: error.message }
        : { message: 'Server error' },
      { status: 500 },
    );
  }
}
