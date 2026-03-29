export type LeadDynamicFieldType = 'text' | 'select' | 'textarea' | 'checkbox';

export type LeadDynamicField = {
  id: string;
  label: string;
  type: LeadDynamicFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

export type NewsArticle = {
  title: string;
  slug: string;
  excerpt: string;
  readTime: string;
  contentIntro: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
};

export type NewsSector = {
  name: string;
  slug: string;
  aliases?: string[];
  shortDescription: string;
  serviceTypeOptions: string[];
  dynamicFields: LeadDynamicField[];
  news: NewsArticle[];
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function article(
  title: string,
  excerpt: string,
  readTime: string,
  contentIntro: string,
  sections: Array<{ heading: string; paragraphs: string[] }>,
): NewsArticle {
  return {
    title,
    slug: slugify(title),
    excerpt,
    readTime,
    contentIntro,
    sections,
  };
}

export const DODDAPANENI_NEWS_SECTORS: NewsSector[] = [
  {
    name: 'Information Technology & AI Development',
    slug: 'information-technology-ai-development',
    aliases: ['information-technology'],
    shortDescription: 'Software delivery, cloud modernization, AI-led automation, and digital transformation.',
    serviceTypeOptions: ['AI consulting', 'Custom software', 'Cloud migration', 'Data engineering', 'Automation'],
    dynamicFields: [
      { id: 'companyName', label: 'Company Name', type: 'text', required: true },
      {
        id: 'projectType',
        label: 'Project Type',
        type: 'select',
        required: true,
        options: ['Web application', 'Mobile application', 'AI/ML solution', 'Enterprise platform', 'Other'],
      },
      { id: 'budget', label: 'Budget', type: 'text', required: true, placeholder: 'e.g. $25,000 - $50,000' },
      {
        id: 'timeline',
        label: 'Timeline',
        type: 'select',
        required: true,
        options: ['Immediate', '1-3 months', '3-6 months', '6+ months'],
      },
      { id: 'requirements', label: 'Requirement Description', type: 'textarea', required: true },
    ],
    news: [
      article(
        'The Future of AI in Business',
        'How AI-driven automation and analytics improve efficiency, decisions, and customer value.',
        '6 min read',
        "Artificial Intelligence is rapidly transforming industries across the globe. From automation to predictive analytics, AI is enabling businesses to make smarter decisions, reduce costs, and improve customer experience. Companies adopting AI technologies are gaining a competitive advantage in today's digital economy.",
        [
          {
            heading: 'Why AI matters now',
            paragraphs: [
              'AI adoption has moved from experimentation to operations. Modern organizations now integrate AI into customer support, demand forecasting, fraud detection, and quality control.',
              'This shift is happening because cloud infrastructure, better data tooling, and mature models make AI both more accessible and more measurable for business teams.',
            ],
          },
          {
            heading: 'How to implement AI sustainably',
            paragraphs: [
              'Successful teams begin with one high-impact use case, validate outcomes, and scale based on clear ROI metrics.',
              'Governance is equally important: model quality checks, human review for sensitive decisions, and transparent data practices ensure responsible long-term adoption.',
            ],
          },
        ],
      ),
    ],
  },
  {
    name: 'Digital Marketing',
    slug: 'digital-marketing',
    shortDescription: 'Performance campaigns, SEO, content strategy, and measurable revenue growth.',
    serviceTypeOptions: ['SEO', 'PPC', 'Content marketing', 'Social media', 'Marketing automation'],
    dynamicFields: [
      { id: 'businessName', label: 'Business Name', type: 'text', required: true },
      {
        id: 'serviceNeeded',
        label: 'Service Needed',
        type: 'select',
        required: true,
        options: ['SEO', 'Paid ads', 'Content strategy', 'Email campaigns', 'Full-funnel growth'],
      },
      { id: 'monthlyBudget', label: 'Monthly Budget', type: 'text', required: true },
      { id: 'websiteUrl', label: 'Website URL', type: 'text', required: false, placeholder: 'https://example.com' },
    ],
    news: [
      article(
        'Performance Marketing in 2026',
        'A practical framework for balancing paid and organic growth in volatile markets.',
        '5 min read',
        'Modern digital marketing requires balancing short-term acquisition with long-term brand and organic growth.',
        [
          {
            heading: 'Channel mix strategy',
            paragraphs: [
              'High-performing teams diversify spend across search, social, and lifecycle channels.',
              'Attribution should be paired with incrementality testing to avoid over-crediting last-click outcomes.',
            ],
          },
        ],
      ),
    ],
  },
  {
    name: 'Healthcare & Medical',
    slug: 'healthcare-medical',
    shortDescription: 'Care operations, digital health platforms, and patient engagement optimization.',
    serviceTypeOptions: ['Patient acquisition', 'Telehealth workflow', 'Hospital IT', 'Care analytics', 'Medical branding'],
    dynamicFields: [
      { id: 'condition', label: 'Condition', type: 'text', required: true },
      { id: 'preferredDoctor', label: 'Preferred Doctor', type: 'text', required: false },
      {
        id: 'appointmentTimeframe',
        label: 'Appointment timeframe',
        type: 'select',
        required: true,
        options: ['Within 24 hours', 'This week', 'This month', 'Flexible'],
      },
      {
        id: 'insuranceStatus',
        label: 'Insurance status',
        type: 'select',
        required: true,
        options: ['Insured', 'Self-pay', 'Pending approval'],
      },
    ],
    news: [
      article(
        'Digital Care Pathways That Scale',
        'How healthcare teams reduce friction in patient journeys with coordinated digital systems.',
        '5 min read',
        'Patient-centered healthcare now depends on integrated digital workflows that reduce delays and improve quality of care.',
        [{ heading: 'Operational impact', paragraphs: ['Workflow automation and better triage improve access while reducing admin load.'] }],
      ),
    ],
  },
  {
    name: 'Construction & Real Estate',
    slug: 'construction-real-estate',
    shortDescription: 'Project execution, real estate advisory, and end-to-end transaction support.',
    serviceTypeOptions: ['Project planning', 'Property advisory', 'Commercial development', 'Residential sales', 'Vendor sourcing'],
    dynamicFields: [
      {
        id: 'intent',
        label: 'Buying / Selling / Renting',
        type: 'select',
        required: true,
        options: ['Buying', 'Selling', 'Renting'],
      },
      { id: 'budgetRange', label: 'Budget Range', type: 'text', required: true },
      {
        id: 'propertyType',
        label: 'Property Type',
        type: 'select',
        required: true,
        options: ['Apartment', 'Villa', 'Office', 'Land', 'Warehouse'],
      },
      {
        id: 'timeline',
        label: 'Timeline',
        type: 'select',
        required: true,
        options: ['Immediate', '1-3 months', '3-6 months', '6+ months'],
      },
      {
        id: 'loanPreApproval',
        label: 'Loan Pre-approval',
        type: 'select',
        required: false,
        options: ['Yes', 'No', 'In progress'],
      },
    ],
    news: [
      article(
        'Smarter Construction Planning',
        'Why integrated planning and procurement improve timelines and cost predictability.',
        '4 min read',
        'Construction projects are increasingly managed with data-backed planning and risk controls from day one.',
        [{ heading: 'Execution certainty', paragraphs: ['Pre-construction clarity improves vendor alignment and minimizes schedule slippage.'] }],
      ),
    ],
  },
  {
    name: 'E-commerce & Marketplace',
    slug: 'ecommerce-marketplace',
    shortDescription: 'Marketplace growth, conversion optimization, and omnichannel commerce operations.',
    serviceTypeOptions: ['Store launch', 'Marketplace expansion', 'Conversion optimization', 'Retention strategy'],
    dynamicFields: [
      { id: 'storeName', label: 'Store/Brand Name', type: 'text', required: true },
      { id: 'primaryChannel', label: 'Primary Channel', type: 'select', required: true, options: ['D2C', 'Marketplace', 'Both'] },
      { id: 'monthlyOrders', label: 'Monthly Orders', type: 'text', required: false },
      { id: 'techStack', label: 'Current Platform', type: 'text', required: false, placeholder: 'Shopify, WooCommerce, custom, etc.' },
    ],
    news: [
      article(
        'Marketplace Expansion Playbook',
        'A phased approach to product, pricing, and fulfillment when entering new channels.',
        '5 min read',
        'Sustainable e-commerce growth depends on profitable channel expansion and repeat customer value.',
        [{ heading: 'Margin-first scaling', paragraphs: ['Merchandising and fulfillment strategy should be optimized before ad spend expansion.'] }],
      ),
    ],
  },
  {
    name: 'Media, News & Entertainment',
    slug: 'media-news-entertainment',
    shortDescription: 'Audience growth, content distribution, and monetization strategy for modern media brands.',
    serviceTypeOptions: ['Editorial strategy', 'Audience growth', 'Video monetization', 'Publishing platform'],
    dynamicFields: [
      { id: 'mediaBrand', label: 'Media Brand', type: 'text', required: true },
      { id: 'contentFormat', label: 'Primary Content Format', type: 'select', required: true, options: ['Text', 'Video', 'Audio', 'Mixed'] },
      { id: 'monthlyAudience', label: 'Monthly Audience', type: 'text', required: false },
      { id: 'monetizationGoal', label: 'Monetization Goal', type: 'text', required: false },
    ],
    news: [
      article(
        'Audience Retention in Digital Media',
        'How media brands improve engagement with better content packaging and distribution.',
        '4 min read',
        'Media businesses are investing in retention metrics to stabilize traffic and revenue predictability.',
        [{ heading: 'Retention-first metrics', paragraphs: ['Returning visitors and session depth often matter more than raw impressions.'] }],
      ),
    ],
  },
  {
    name: 'Staffing & Consultancy',
    slug: 'staffing-consultancy',
    shortDescription: 'Talent acquisition and advisory services for high-skill and growth-critical roles.',
    serviceTypeOptions: ['Permanent hiring', 'Contract staffing', 'Executive search', 'Consulting'],
    dynamicFields: [
      { id: 'hiringVolume', label: 'Hiring Volume', type: 'text', required: true },
      { id: 'roleCategory', label: 'Role Category', type: 'text', required: true },
      { id: 'seniority', label: 'Seniority Level', type: 'select', required: true, options: ['Junior', 'Mid-level', 'Senior', 'Leadership'] },
      { id: 'locationPreference', label: 'Location Preference', type: 'text', required: false },
    ],
    news: [
      article(
        'Workforce Planning for Growth',
        'How organizations align hiring plans with operational expansion and cost targets.',
        '4 min read',
        'Strategic staffing blends workforce analytics, role prioritization, and predictable hiring pipelines.',
        [{ heading: 'Planning fundamentals', paragraphs: ['Demand forecasting helps teams hire for business impact rather than urgency.'] }],
      ),
    ],
  },
  {
    name: 'Food & Beverages',
    slug: 'food-beverages',
    shortDescription: 'Operational efficiency, supply quality, and brand-led growth for food businesses.',
    serviceTypeOptions: ['Food processing', 'Quality compliance', 'Distribution', 'Brand growth'],
    dynamicFields: [
      { id: 'businessType', label: 'Business Type', type: 'select', required: true, options: ['Manufacturer', 'Distributor', 'Retailer', 'Restaurant'] },
      { id: 'productCategory', label: 'Product Category', type: 'text', required: true },
      { id: 'complianceNeeds', label: 'Compliance Needs', type: 'text', required: false },
      { id: 'distributionRegion', label: 'Distribution Region', type: 'text', required: false },
    ],
    news: [
      article(
        'Operational Excellence in Food Production',
        'How process controls and quality systems improve consistency and margins.',
        '4 min read',
        'Food and beverage operations benefit from process digitization and rigorous quality assurance frameworks.',
        [{ heading: 'Quality and throughput', paragraphs: ['Standardized operations reduce waste while improving delivery reliability.'] }],
      ),
    ],
  },
  {
    name: 'Manufacturing & Trading',
    slug: 'manufacturing-trading',
    shortDescription: 'Production optimization and cross-border trade support for industrial businesses.',
    serviceTypeOptions: ['Factory optimization', 'Export strategy', 'Procurement', 'Trading operations'],
    dynamicFields: [
      { id: 'industrySegment', label: 'Industry Segment', type: 'text', required: true },
      { id: 'productionCapacity', label: 'Production Capacity', type: 'text', required: false },
      { id: 'exportMarkets', label: 'Target Export Markets', type: 'text', required: false },
      { id: 'supplyPainPoints', label: 'Supply Chain Pain Points', type: 'textarea', required: false },
    ],
    news: [
      article(
        'Industry 4.0 Readiness for Manufacturers',
        'A practical roadmap for automation, data visibility, and continuous improvement.',
        '5 min read',
        'Manufacturers can improve throughput and resilience by combining process data, automation, and planning discipline.',
        [{ heading: 'Roadmap to modernization', paragraphs: ['Start with bottleneck mapping and measurable pilot programs before scaling.'] }],
      ),
    ],
  },
  {
    name: 'Logistics & Warehousing',
    slug: 'logistics-warehousing',
    shortDescription: 'Supply chain performance, warehouse efficiency, and network reliability.',
    serviceTypeOptions: ['Warehouse setup', 'Fulfillment optimization', 'Transport planning', 'Inventory analytics'],
    dynamicFields: [
      { id: 'warehouseCount', label: 'Number of Warehouses', type: 'text', required: false },
      { id: 'shippingVolume', label: 'Monthly Shipping Volume', type: 'text', required: true },
      { id: 'currentWms', label: 'Current WMS/ERP', type: 'text', required: false },
      { id: 'deliverySla', label: 'Target Delivery SLA', type: 'text', required: false },
    ],
    news: [
      article(
        'Resilient Supply Chains in 2026',
        'How logistics teams balance speed, cost, and service-level commitments.',
        '4 min read',
        'Logistics leaders are prioritizing network flexibility and real-time visibility to sustain service quality.',
        [{ heading: 'Reliability at scale', paragraphs: ['Integrated planning improves on-time delivery without excessive inventory buffers.'] }],
      ),
    ],
  },
  {
    name: 'Education & Skill Development',
    slug: 'education-skill-development',
    shortDescription: 'Learning design, skilling programs, and digital education platforms.',
    serviceTypeOptions: ['Curriculum design', 'LMS setup', 'Corporate skilling', 'Career programs'],
    dynamicFields: [
      { id: 'institutionType', label: 'Institution Type', type: 'select', required: true, options: ['School', 'College', 'Training center', 'Corporate L&D'] },
      { id: 'learnerCount', label: 'Learner Count', type: 'text', required: false },
      { id: 'programGoal', label: 'Program Goal', type: 'text', required: true },
      { id: 'deliveryMode', label: 'Delivery Mode', type: 'select', required: true, options: ['Online', 'Offline', 'Hybrid'] },
    ],
    news: [
      article(
        'Skills-First Learning Models',
        'Why competency-based outcomes are reshaping education and workforce readiness.',
        '4 min read',
        'Education providers are focusing on measurable skill outcomes and stronger learner-employer alignment.',
        [{ heading: 'Outcome design', paragraphs: ['Programs that tie curriculum to job outcomes deliver stronger placement results.'] }],
      ),
    ],
  },
  {
    name: 'Import & Export',
    slug: 'import-export',
    shortDescription: 'Trade enablement, compliance, and market-entry support for global commerce.',
    serviceTypeOptions: ['Trade advisory', 'Documentation', 'Customs support', 'Market entry'],
    dynamicFields: [
      { id: 'tradeDirection', label: 'Trade Direction', type: 'select', required: true, options: ['Import', 'Export', 'Both'] },
      { id: 'productType', label: 'Product Type', type: 'text', required: true },
      { id: 'targetCountries', label: 'Target Countries', type: 'text', required: true },
      { id: 'complianceSupport', label: 'Compliance Support Needed', type: 'text', required: false },
    ],
    news: [
      article(
        'Expanding Trade in Emerging Markets',
        'How businesses reduce risk while entering new cross-border trade corridors.',
        '5 min read',
        'Import-export growth depends on market intelligence, documentation discipline, and partner reliability.',
        [{ heading: 'Go-to-market readiness', paragraphs: ['A phased market-entry model improves compliance and protects working capital.'] }],
      ),
    ],
  },
];

const SECTOR_BY_SLUG = new Map<string, NewsSector>();
for (const sector of DODDAPANENI_NEWS_SECTORS) {
  SECTOR_BY_SLUG.set(sector.slug, sector);
  for (const alias of sector.aliases ?? []) {
    SECTOR_BY_SLUG.set(alias, sector);
  }
}

export function canonicalSectorSlug(inputSlug: string): string | null {
  const sector = SECTOR_BY_SLUG.get(inputSlug.toLowerCase());
  return sector?.slug ?? null;
}

export function getSectorBySlug(inputSlug: string): NewsSector | null {
  return SECTOR_BY_SLUG.get(inputSlug.toLowerCase()) ?? null;
}

export function getNewsArticle(sector: NewsSector, newsSlug: string): NewsArticle | null {
  return sector.news.find((n) => n.slug === newsSlug) ?? null;
}

export function allDoddapaneniNewsStaticParams() {
  return DODDAPANENI_NEWS_SECTORS.flatMap((sector) =>
    sector.news.map((news) => ({ sector: sector.slug, newsTitle: news.slug })),
  );
}
