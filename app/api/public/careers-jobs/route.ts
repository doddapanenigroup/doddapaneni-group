import { NextResponse } from 'next/server';
import { getPublishedCareerJobsCached } from '@/lib/data/careers-public';
import { routing } from '@/i18n/routing';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get('locale')?.trim().toLowerCase() || routing.defaultLocale;
  const locale = routing.locales.includes(raw as (typeof routing.locales)[number]) ? raw : routing.defaultLocale;
  const jobs = await getPublishedCareerJobsCached(locale);
  return NextResponse.json({ jobs });
}
