import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logContentEdit } from '@/lib/audit-log';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { runTranslateAll } from '@/lib/run-translate-all';
import { hasDeveloperAccess } from '@/lib/role-utils';

const PAGE_KEY_TO_PATH: Record<string, string> = {
  home: 'app/[locale]/page.tsx',
  about: 'app/[locale]/about/page.tsx',
  services: 'app/[locale]/services/page.tsx',
  contact: 'app/[locale]/contact/page.tsx',
  'companies-dealsmedi': 'app/[locale]/companies/dealsmedi/page.tsx',
  'companies-dlsin': 'app/[locale]/companies/dlsin/page.tsx',
  'companies-janatha-mirror': 'app/[locale]/companies/janatha-mirror/page.tsx',
  'messages-en': 'messages/en.json',
};

function getFilePath(pageKey: string): string | null {
  const rel = PAGE_KEY_TO_PATH[pageKey];
  if (!rel) return null;
  const absolute = path.resolve(process.cwd(), rel);
  const cwd = process.cwd();
  if (!absolute.startsWith(cwd)) return null;
  return absolute;
}

export async function GET(request: Request) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || !hasDeveloperAccess(role as any)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const pageKey = url.searchParams.get('pageKey')?.trim();
  if (!pageKey || !PAGE_KEY_TO_PATH[pageKey]) {
    return NextResponse.json({ message: 'Invalid pageKey' }, { status: 400 });
  }

  const filePath = getFilePath(pageKey);
  if (!filePath) {
    return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
  }

  try {
    const content = await readFile(filePath, 'utf-8');
    return NextResponse.json({
      content,
      filePath: PAGE_KEY_TO_PATH[pageKey],
    });
  } catch (err) {
    console.error('Developer file read error:', err);
    return NextResponse.json({ message: 'Failed to read file' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || !hasDeveloperAccess(role as any)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  let body: { pageKey?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const pageKey = body.pageKey?.trim();
  if (!pageKey || !PAGE_KEY_TO_PATH[pageKey]) {
    return NextResponse.json({ message: 'Invalid pageKey' }, { status: 400 });
  }
  const content = typeof body.content === 'string' ? body.content : '';

  const filePath = getFilePath(pageKey);
  if (!filePath) {
    return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
  }

  try {
    await writeFile(filePath, content, 'utf-8');
    await logContentEdit({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: role ?? '',
      kind: 'file',
      targetPath: PAGE_KEY_TO_PATH[pageKey],
      summary: `${content.length} characters`,
    });
    const response: { ok: boolean; filePath: string; translateAll?: Awaited<ReturnType<typeof runTranslateAll>> } = {
      ok: true,
      filePath: PAGE_KEY_TO_PATH[pageKey],
    };
    if (pageKey === 'messages-en') {
      try {
        response.translateAll = await runTranslateAll();
      } catch (err) {
        console.error('Auto translate-all after en.json save:', err);
      }
    }
    return NextResponse.json(response);
  } catch (err) {
    console.error('Developer file write error:', err);
    return NextResponse.json({ message: 'Failed to write file' }, { status: 500 });
  }
}
