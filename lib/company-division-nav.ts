import type { CompanyDivisionSlug } from '@/lib/company-divisions';
import { isCompanyDivisionSlug } from '@/lib/company-divisions';

export type DivisionTopicNavRef = {
  /** Hash id without `#`, e.g. `topic-commerce` */
  topicId: string;
  href: string;
};

const TOPIC_NAV_BY_SLUG = {
  'software-it-ai': [
    { topicId: 'topic-commerce', href: '/software-it-ai#topic-commerce' },
    { topicId: 'topic-sellers', href: '/software-it-ai#topic-sellers' },
    { topicId: 'topic-platform', href: '/software-it-ai#topic-platform' },
  ],
  'digital-marketing': [
    { topicId: 'topic-seo', href: '/digital-marketing#topic-seo' },
    { topicId: 'topic-ads', href: '/digital-marketing#topic-ads' },
    { topicId: 'topic-social', href: '/digital-marketing#topic-social' },
  ],
  'healthcare-medical': [
    { topicId: 'topic-clinical', href: '/healthcare-medical#topic-clinical' },
    { topicId: 'topic-billing', href: '/healthcare-medical#topic-billing' },
    { topicId: 'topic-supplies', href: '/healthcare-medical#topic-supplies' },
  ],
  'construction-realestate': [
    { topicId: 'topic-projects', href: '/construction-realestate#topic-projects' },
    { topicId: 'topic-design', href: '/construction-realestate#topic-design' },
    { topicId: 'topic-realty', href: '/construction-realestate#topic-realty' },
  ],
  'ecommerce-marketplace': [
    { topicId: 'topic-stores', href: '/ecommerce-marketplace#topic-stores' },
    { topicId: 'topic-marketplaces', href: '/ecommerce-marketplace#topic-marketplaces' },
    { topicId: 'topic-fulfillment', href: '/ecommerce-marketplace#topic-fulfillment' },
  ],
  'media-news-entertainment': [
    { topicId: 'topic-newsroom', href: '/media-news-entertainment#topic-newsroom' },
    { topicId: 'topic-content', href: '/media-news-entertainment#topic-content' },
    { topicId: 'topic-brand', href: '/media-news-entertainment#topic-brand' },
  ],
  'staffing-consultancy': [
    { topicId: 'topic-hiring', href: '/staffing-consultancy#topic-hiring' },
    { topicId: 'topic-hr', href: '/staffing-consultancy#topic-hr' },
    { topicId: 'topic-talent', href: '/staffing-consultancy#topic-talent' },
  ],
  'food-beverages': [
    { topicId: 'topic-processing', href: '/food-beverages#topic-processing' },
    { topicId: 'topic-supply', href: '/food-beverages#topic-supply' },
    { topicId: 'topic-quality', href: '/food-beverages#topic-quality' },
  ],
  'manufacturing-trading': [
    { topicId: 'topic-plants', href: '/manufacturing-trading#topic-plants' },
    { topicId: 'topic-trading', href: '/manufacturing-trading#topic-trading' },
    { topicId: 'topic-industry', href: '/manufacturing-trading#topic-industry' },
  ],
  'logistics-warehousing': [
    { topicId: 'topic-freight', href: '/logistics-warehousing#topic-freight' },
    { topicId: 'topic-warehouse', href: '/logistics-warehousing#topic-warehouse' },
    { topicId: 'topic-lastmile', href: '/logistics-warehousing#topic-lastmile' },
  ],
  'education-skill': [
    { topicId: 'topic-training', href: '/education-skill#topic-training' },
    { topicId: 'topic-elearning', href: '/education-skill#topic-elearning' },
    { topicId: 'topic-skills', href: '/education-skill#topic-skills' },
  ],
  'import-export': [
    { topicId: 'topic-trade', href: '/import-export#topic-trade' },
    { topicId: 'topic-compliance', href: '/import-export#topic-compliance' },
    { topicId: 'topic-partners', href: '/import-export#topic-partners' },
  ],
} as const satisfies Record<CompanyDivisionSlug, DivisionTopicNavRef[]>;

/** Structural topic links only — labels come from `messages/division-topics.json` via `getTranslatedDivisionTopicNavItems`. */
export function getDivisionTopicNavItems(slug: string): DivisionTopicNavRef[] {
  if (!isCompanyDivisionSlug(slug)) return [];
  return [...TOPIC_NAV_BY_SLUG[slug]];
}

export function topicAnchorIdFromHref(href: string): string | null {
  const hash = href.split('#')[1];
  return hash?.trim() ? hash.trim() : null;
}
