import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logContentEdit } from '@/lib/audit-log';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { runTranslateAll } from '@/lib/run-translate-all';
import { hasDeveloperAccess } from '@/lib/role-utils';

const PAGE_KEY_TO_RELPATH: Record<string, string> = {
  home: 'app/[locale]/page.tsx',
  about: 'app/[locale]/about/page.tsx',
  contact: 'app/[locale]/contact/page.tsx',
  'companies-dealsmedi': 'app/[locale]/companies/dealsmedi/page.tsx',
  'companies-dlsin': 'app/[locale]/companies/dlsin/page.tsx',
  'companies-janatha-mirror': 'app/[locale]/companies/janatha-mirror/page.tsx',
  'messages-en': 'messages/en.json',
};

/** Resolves paths with literal segments after `cwd` (paired with `outputFileTracingExcludes` in next.config). */
function getFilePath(pageKey: string): string | null {
  const root = process.cwd();
  let absolute: string;
  switch (pageKey) {
    case 'home':
      absolute = path.join(root, 'app', '[locale]', 'page.tsx');
      break;
    case 'about':
      absolute = path.join(root, 'app', '[locale]', 'about', 'page.tsx');
      break;
    case 'contact':
      absolute = path.join(root, 'app', '[locale]', 'contact', 'page.tsx');
      break;
    case 'companies-dealsmedi':
      absolute = path.join(root, 'app', '[locale]', 'companies', 'dealsmedi', 'page.tsx');
      break;
    case 'companies-dlsin':
      absolute = path.join(root, 'app', '[locale]', 'companies', 'dlsin', 'page.tsx');
      break;
    case 'companies-janatha-mirror':
      absolute = path.join(root, 'app', '[locale]', 'companies', 'janatha-mirror', 'page.tsx');
      break;
    case 'messages-en':
      absolute = path.join(root, 'messages', 'en.json');
      break;
    default:
      return null;
  }
  if (!absolute.startsWith(root)) return null;
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
  if (!pageKey || !PAGE_KEY_TO_RELPATH[pageKey]) {
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
      filePath: PAGE_KEY_TO_RELPATH[pageKey],
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
  if (!pageKey || !PAGE_KEY_TO_RELPATH[pageKey]) {
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
      targetPath: PAGE_KEY_TO_RELPATH[pageKey],
      summary: `${content.length} characters`,
    });
    const response: { ok: boolean; filePath: string; translateAll?: Awaited<ReturnType<typeof runTranslateAll>> } = {
      ok: true,
      filePath: PAGE_KEY_TO_RELPATH[pageKey],
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
