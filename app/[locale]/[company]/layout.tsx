import { generateCompanySegmentStaticParams } from '@/lib/company-route-static';

/** Twelve division URLs are generated at build; other sector slugs remain request-rendered. */
export const dynamicParams = true;

// Sector "live" toggles are admin-controlled and should reflect immediately.
export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return generateCompanySegmentStaticParams();
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string; company: string }>;
};

/**
 * Sector routes render full-page content (same pattern as static `/construction-realestate`).
 * The old division nav band (Overview / About / …) lived in `DivisionLayoutServer` and is intentionally omitted.
 */
export default async function CompanySectionLayout({ children }: Props) {
  return <>{children}</>;
}
