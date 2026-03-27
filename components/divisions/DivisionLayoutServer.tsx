import { notFound } from 'next/navigation';
import CompanyDivisionShell from '@/components/divisions/CompanyDivisionShell';
import { getSectorBySlug } from '@/lib/sector-landing';
import type { CompanyDivisionSlug } from '@/lib/company-divisions';
import { getDivisionTopicNavItems } from '@/lib/company-division-nav';

export default async function DivisionLayoutServer({
  slug,
  children,
}: {
  slug: CompanyDivisionSlug;
  children: React.ReactNode;
}) {
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  const topicNavItems = getDivisionTopicNavItems(slug);

  return (
    <CompanyDivisionShell
      sector={{ name: sector.name, slug: sector.slug }}
      topicNavItems={topicNavItems}
    >
      {children}
    </CompanyDivisionShell>
  );
}
