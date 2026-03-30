import { notFound } from 'next/navigation';
import CompanyDivisionShell from '@/components/divisions/CompanyDivisionShell';
import { getSectorBySlug } from '@/lib/sector-landing';
import type { CompanyDivisionSlug } from '@/lib/company-divisions';
import { getTranslatedDivisionTopicNavItems } from '@/lib/company-division-nav-i18n';

export default async function DivisionLayoutServer({
  slug,
  locale,
  children,
}: {
  slug: CompanyDivisionSlug;
  locale: string;
  children: React.ReactNode;
}) {
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  const topicNavItems = await getTranslatedDivisionTopicNavItems(slug, locale);

  return (
    <CompanyDivisionShell
      sector={{ name: sector.name, slug: sector.slug }}
      topicNavItems={topicNavItems}
    >
      {children}
    </CompanyDivisionShell>
  );
}
