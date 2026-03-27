import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { runTranslateAll } from '@/lib/run-translate-all';
import { hasDeveloperAccess } from '@/lib/role-utils';

export const runtime = 'nodejs';
/** Allow long runs when translating hundreds of keys (e.g. Vercel Pro / local dev). */
export const maxDuration = 300;

export async function POST() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || !hasDeveloperAccess(role as any)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await runTranslateAll();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Translate-all error:', err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Translation failed' },
      { status: 500 }
    );
  }
}
