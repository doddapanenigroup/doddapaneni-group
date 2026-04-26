import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { allowMarketerModule } from '@/app/api/marketer/_permissions';
import { captureErrorToDb } from '@/lib/error-monitor';

export const maxDuration = 120;

/**
 * Previously returned machine-translated fields for the create flow.
 * `/news` is English-only; this endpoint is disabled.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(await allowMarketerModule(session.user.role as any, 'blogs'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(
      {
        message:
          'News locale translations are disabled. Public /news shows the English article for all languages.',
      },
      { status: 410 },
    );
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
