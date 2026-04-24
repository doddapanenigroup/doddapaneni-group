import DivisionLayoutServer from '@/components/divisions/DivisionLayoutServer';
import { isCompanyDivisionSlug } from '@/lib/company-divisions';
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
 * Nested layout for sector/division URLs (`/[locale]/software-it-ai`, etc.).
 * Twelve primary divisions get the shared shell (header band + about / services / companies / contact).
 * Other sector slugs still resolve here but only render page content (no division chrome).
 */
export default async function CompanySectionLayout({ children, params }: Props) {
  const { company, locale } = await params;
  const slug = company.trim().toLowerCase();

  if (!isCompanyDivisionSlug(slug)) {
    return <>{children}</>;
  }

  return (
    <DivisionLayoutServer slug={slug} locale={locale}>
      {children}
    </DivisionLayoutServer>
  );
}
