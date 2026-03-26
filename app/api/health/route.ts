import { NextResponse } from 'next/server';
import { recordApiRequest } from '@/lib/request-monitor';
import { ensureEnvValidatedOnce } from '@/lib/env-validate';

/**
 * Health check for load balancers and hosting platforms (Vercel, Railway, etc.).
 * GET /api/health returns 200 when the app is running.
 */
export async function GET(request: Request) {
  // Monitoring only; tiny overhead.
  recordApiRequest({ request, userId: null });
  // Validate env once at (effective) server start.
  ensureEnvValidatedOnce();
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
  