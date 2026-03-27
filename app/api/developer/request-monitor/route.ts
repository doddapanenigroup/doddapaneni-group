import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { Role } from '@/lib/constants';
import { recordApiRequest, requestMonitor } from '@/lib/request-monitor';
import { hasDeveloperAccess } from '@/lib/role-utils';

function allowedRole(role: Role | undefined): boolean {
  return hasDeveloperAccess(role);
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    const role = session?.user?.role as Role | undefined;
    if (!session?.user || !allowedRole(role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    recordApiRequest({ request, userId: session.user.id });

    const url = new URL(request.url);
    const windowMinutes = Number(url.searchParams.get('windowMinutes') || 10);
    const limit = Number(url.searchParams.get('limit') || 20);

    return NextResponse.json(requestMonitor.snapshot({ windowMinutes, limit }));
  } catch (error) {
    console.error('Developer request-monitor GET error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

