import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { hasDeveloperAccess } from '@/lib/role-utils';
import type { Role } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function appendLog(base: string, line: string) {
  return base + (base.endsWith('\n') ? '' : '\n') + line;
}

export async function POST(request: Request) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (!session?.user?.id || !hasDeveloperAccess(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  let reason = '';
  try {
    const body = (await request.json().catch(() => ({}))) as { reason?: unknown };
    if (typeof body?.reason === 'string') reason = body.reason.trim().slice(0, 500);
  } catch {
    /* empty */
  }

  const who = session.user.email ?? session.user.id;
  const started = new Date().toISOString();
  let logs = `Build request at ${started}\nRequested by: ${who}\n`;
  if (reason) logs = appendLog(logs, `Note: ${reason}`);
  logs = appendLog(logs, 'Recorded for audit (no external deploy hook).');

  try {
    await connectDb();
    const row = await prisma.deployment.create({
      data: {
        status: 'recorded',
        logs,
      },
    });

    return NextResponse.json({ ok: true, deployment: { id: row.id, status: 'recorded' } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('POST /api/build error:', e);
    await captureErrorToDb({
      error: e,
      user: { id: session.user.id, email: session.user.email, role: session.user.role },
      context: 'api/build',
    });
    return NextResponse.json({ message: msg.slice(0, 200) || 'Server error' }, { status: 500 });
  }
}
