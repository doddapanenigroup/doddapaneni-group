/**
 * First-load defaults for marketer “ad slots” and “category ads” reference tables.
 * Seeded lazily from GET handlers when the tables are empty.
 */

export type MarketingAdSlotSeed = {
  slug: string;
  label: string;
  description?: string | null;
  recommendedWidth: number | null;
  recommendedHeight: number | null;
  diagramRegion: string | null;
  sortOrder: number;
};

export type MarketingAdCategorySeed = {
  slug: string;
  label: string;
  sortOrder: number;
};

export const DEFAULT_MARKETING_AD_SLOTS: MarketingAdSlotSeed[] = [
  {
    slug: 'header-top',
    label: 'Header top',
    description: 'Leaderboard-style horizontal strip above article chrome.',
    recommendedWidth: 728,
    recommendedHeight: 90,
    diagramRegion: 'header_top',
    sortOrder: 0,
  },
  {
    slug: 'article-body',
    label: 'Article body',
    description: 'In-content placements between paragraphs.',
    recommendedWidth: 300,
    recommendedHeight: 250,
    diagramRegion: 'article_body',
    sortOrder: 1,
  },
  {
    slug: 'sidebar',
    label: 'Sidebar',
    description: 'Skyline / half-page style sidebar slot.',
    recommendedWidth: 300,
    recommendedHeight: 600,
    diagramRegion: 'sidebar',
    sortOrder: 2,
  },
  {
    slug: 'below-fold',
    label: 'Below fold',
    description: 'Wide placement below primary article fold.',
    recommendedWidth: 970,
    recommendedHeight: 250,
    diagramRegion: 'below_fold',
    sortOrder: 3,
  },
];

export const DEFAULT_MARKETING_AD_CATEGORIES: MarketingAdCategorySeed[] = [
  { slug: 'seo', label: 'SEO', sortOrder: 0 },
  { slug: 'digital-marketing', label: 'Digital Marketing', sortOrder: 1 },
  { slug: 'web-development', label: 'Web Development', sortOrder: 2 },
  { slug: 'real-estate', label: 'Real Estate', sortOrder: 3 },
  { slug: 'healthcare', label: 'Healthcare', sortOrder: 4 },
  { slug: 'content-marketing', label: 'Content Marketing', sortOrder: 5 },
];
