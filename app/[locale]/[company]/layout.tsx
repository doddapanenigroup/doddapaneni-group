import DivisionLayoutServer from '@/components/divisions/DivisionLayoutServer';
import { isActiveHomeDivisionSlug, isCompanyDivisionSlug } from '@/lib/company-divisions';
import { generateCompanySegmentStaticParams } from '@/lib/company-route-static';

/** Twelve division URLs are generated at build; other sector slugs remain request-rendered. */
export const dynamicParams = true;

export const revalidate = 300;

export function generateStaticParams() {
  return generateCompanySegmentStaticParams();
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string; company: string }>;
};

/**
 * Nested layout for sector/division URLs (`/[locale]/software-it-ai`, etc.).
 * Twelve primary divisions get the shared shell (header band + services/about/contact sub-nav).
 * Other sector slugs still resolve here but only render page content (no division chrome).
 */
export default async function CompanySectionLayout({ children, params }: Props) {
  const { company, locale } = await params;
  const slug = company.trim().toLowerCase();

  if (!isCompanyDivisionSlug(slug)) {
    return <>{children}</>;
  }

  // For the 4 active sector hubs, render only the page content (company list),
  // without the division chrome (overview/about/services/contact + focus chips).
  if (isActiveHomeDivisionSlug(slug)) {
    return <>{children}</>;
  }

  return (
    <DivisionLayoutServer slug={slug} locale={locale}>
      {children}
    </DivisionLayoutServer>
  );
}
