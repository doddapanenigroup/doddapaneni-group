import { getTranslations } from 'next-intl/server';
import { getDivisionTopicNavItems, type DivisionTopicNavRef } from '@/lib/company-division-nav';
import type { CompanyDivisionSlug } from '@/lib/company-divisions';

export type DivisionTopicNavItem = DivisionTopicNavRef & {
  label: string;
  description: string;
};

/**
 * Resolves division topic labels/descriptions for the active locale from `DivisionTopics` messages
 * (merged from `messages/division-topics.json` in `i18n/request.ts`).
 */
export async function getTranslatedDivisionTopicNavItems(
  slug: string,
  locale: string,
): Promise<DivisionTopicNavItem[]> {
  const refs = getDivisionTopicNavItems(slug);
  if (refs.length === 0) return [];

  const t = await getTranslations({ locale, namespace: 'DivisionTopics' });
  const divisionKey = slug as CompanyDivisionSlug;

  return refs.map((ref) => {
    const labelKey = `${divisionKey}.${ref.topicId}.label`;
    const descKey = `${divisionKey}.${ref.topicId}.description`;
    return {
      ...ref,
      label: t(labelKey as never),
      description: t(descKey as never),
    };
  });
}
