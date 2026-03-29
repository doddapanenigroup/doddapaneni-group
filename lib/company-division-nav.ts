import type { CompanyDivisionSlug } from '@/lib/company-divisions';
import { isCompanyDivisionSlug } from '@/lib/company-divisions';

export type DivisionTopicNavItem = {
  label: string;
  /** Path from site root without locale, e.g. `/software-it-ai/services` or `/software-it-ai#topic-ai` */
  href: string;
  /** Optional one line shown in on-page topic panels */
  description?: string;
};

const TOPIC_NAV_BY_SLUG = {
  'software-it-ai': [
    {
      label: 'Dlsin marketplace',
      href: '/software-it-ai#topic-dlsin',
      description:
        'Dlsin is the group’s multivendor commerce platform—catalogue management, checkout, seller dashboards, and secure settlements for independent merchants.',
    },
    {
      label: 'Seller tooling',
      href: '/software-it-ai#topic-sellers',
      description:
        'Fulfilment status, dispute workflows, and analytics so sellers can restock and price with evidence—not guesswork.',
    },
    {
      label: 'Platform engineering',
      href: '/software-it-ai#topic-platform',
      description:
        'Information technology and AI capacity behind reliable storefronts, integrations, payments, and scalable infrastructure.',
    },
  ],
  'digital-marketing': [
    {
      label: 'SEO',
      href: '/digital-marketing#topic-seo',
      description: 'Organic visibility, technical SEO, and content that ranks.',
    },
    {
      label: 'Ads',
      href: '/digital-marketing#topic-ads',
      description: 'Paid acquisition and performance creative across channels.',
    },
    {
      label: 'Social',
      href: '/digital-marketing#topic-social',
      description: 'Community, brand presence, and social campaigns that convert.',
    },
  ],
  'healthcare-medical': [
    {
      label: 'Clinical',
      href: '/healthcare-medical#topic-clinical',
      description: 'Clinical workflows, compliance-aware tooling, and integrations.',
    },
    {
      label: 'Billing',
      href: '/healthcare-medical#topic-billing',
      description: 'Revenue cycle, coding, and payer operations support.',
    },
    {
      label: 'Supplies',
      href: '/healthcare-medical#topic-supplies',
      description: 'Medical supplies, devices, and distribution logistics.',
    },
  ],
  'construction-realestate': [
    {
      label: 'Projects',
      href: '/construction-realestate#topic-projects',
      description: 'End-to-end delivery from planning through commissioning.',
    },
    {
      label: 'Design',
      href: '/construction-realestate#topic-design',
      description: 'Architecture, engineering coordination, and design quality.',
    },
    {
      label: 'Realty',
      href: '/construction-realestate#topic-realty',
      description: 'Development, investment, and property advisory.',
    },
  ],
  'ecommerce-marketplace': [
    {
      label: 'Stores',
      href: '/ecommerce-marketplace#topic-stores',
      description: 'D2C and B2B storefronts engineered for conversion.',
    },
    {
      label: 'Marketplaces',
      href: '/ecommerce-marketplace#topic-marketplaces',
      description: 'Multi-vendor platforms, catalog ops, and seller tooling.',
    },
    {
      label: 'Fulfillment',
      href: '/ecommerce-marketplace#topic-fulfillment',
      description: 'Order, warehouse, and last-mile orchestration.',
    },
  ],
  'media-news-entertainment': [
    {
      label: 'Janatha Mirror',
      href: '/media-news-entertainment#topic-janatha',
      description:
        'Digital-first newsroom with sourced reporting, verification, and corrections when facts change—public policy, business, culture, and civic coverage optimised for web and social.',
    },
    {
      label: 'Editorial & multimedia',
      href: '/media-news-entertainment#topic-content',
      description:
        'Formats, production, and distribution at scale—video, interviews, and storytelling built for how audiences read and share today.',
    },
    {
      label: 'Audience & partnerships',
      href: '/media-news-entertainment#topic-brand',
      description:
        'Audience products, brand studios, and partnerships that extend reach while protecting editorial standards.',
    },
  ],
  'staffing-consultancy': [
    {
      label: 'Hiring',
      href: '/staffing-consultancy#topic-hiring',
      description: 'Recruitment pipelines and role-specific sourcing.',
    },
    {
      label: 'HR',
      href: '/staffing-consultancy#topic-hr',
      description: 'Policies, people ops, and workforce planning.',
    },
    {
      label: 'Talent',
      href: '/staffing-consultancy#topic-talent',
      description: 'Retention, upskilling, and leadership programmes.',
    },
  ],
  'food-beverages': [
    {
      label: 'Processing',
      href: '/food-beverages#topic-processing',
      description: 'Safe, efficient processing and packaging lines.',
    },
    {
      label: 'Supply',
      href: '/food-beverages#topic-supply',
      description: 'Sourcing, cold chain, and supplier governance.',
    },
    {
      label: 'Quality',
      href: '/food-beverages#topic-quality',
      description: 'QA, traceability, and certification readiness.',
    },
  ],
  'manufacturing-trading': [
    {
      label: 'Plants',
      href: '/manufacturing-trading#topic-plants',
      description: 'Plant operations, throughput, and capex efficiency.',
    },
    {
      label: 'Trading',
      href: '/manufacturing-trading#topic-trading',
      description: 'Wholesale, bulk, and cross-border trade desks.',
    },
    {
      label: 'Industry 4.0',
      href: '/manufacturing-trading#topic-industry',
      description: 'Automation, data, and connected factory initiatives.',
    },
  ],
  'logistics-warehousing': [
    {
      label: 'Freight',
      href: '/logistics-warehousing#topic-freight',
      description: 'Air, ocean, and surface freight orchestration.',
    },
    {
      label: 'Warehouse',
      href: '/logistics-warehousing#topic-warehouse',
      description: 'Storage, WMS, and inventory accuracy.',
    },
    {
      label: 'Last mile',
      href: '/logistics-warehousing#topic-lastmile',
      description: 'Final delivery, routing, and customer experience.',
    },
  ],
  'education-skill': [
    {
      label: 'Training',
      href: '/education-skill#topic-training',
      description: 'Instructor-led and hybrid programmes for teams.',
    },
    {
      label: 'E-learning',
      href: '/education-skill#topic-elearning',
      description: 'Platforms, cohorts, and measurable learning paths.',
    },
    {
      label: 'Skills',
      href: '/education-skill#topic-skills',
      description: 'Vocational and industry certifications.',
    },
  ],
  'import-export': [
    {
      label: 'Trade',
      href: '/import-export#topic-trade',
      description: 'Import/export desks, sourcing, and channel partners.',
    },
    {
      label: 'Compliance',
      href: '/import-export#topic-compliance',
      description: 'Documentation, customs, and regulatory alignment.',
    },
    {
      label: 'Partners',
      href: '/import-export#topic-partners',
      description: 'Global networks for reliable movement of goods.',
    },
  ],
} as const satisfies Record<CompanyDivisionSlug, DivisionTopicNavItem[]>;

export function getDivisionTopicNavItems(slug: string): DivisionTopicNavItem[] {
  if (!isCompanyDivisionSlug(slug)) return [];
  return [...TOPIC_NAV_BY_SLUG[slug]];
}

export function topicAnchorIdFromHref(href: string): string | null {
  const hash = href.split('#')[1];
  return hash?.trim() ? hash.trim() : null;
}
