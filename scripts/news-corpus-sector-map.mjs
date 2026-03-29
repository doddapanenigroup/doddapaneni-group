/**
 * Maps each News corpus blog slug (messages Blog.posts) to a Sector.slug.
 * Shared by seed-news-corpus-blogs.mjs and assign-news-blogs-to-sectors.mjs
 */
export const NEWS_CORPUS_SLUG_TO_SECTOR_SLUG = {
  'future-of-ecommerce-2026': 'ecommerce-marketplace',
  'healthcare-technology-innovations': 'healthcare-medical',
  'sustainable-construction-practices': 'construction-realestate',
  'digital-marketing-strategies': 'digital-marketing',
  'ai-transformation-business': 'software-it-ai',
  'global-trade-opportunities': 'import-export',
  'logistics-automation': 'logistics-warehousing',
  'workforce-development-skills': 'education-skill',
  'media-digital-transformation': 'media-news-entertainment',
  'manufacturing-industry-4-0': 'manufacturing-trading',
  'food-processing-innovation': 'food-beverages',
  'real-estate-investment-tips': 'construction-realestate',
  'cloud-computing-benefits': 'software-it-ai',
  'telemedicine-healthcare': 'healthcare-medical',
  'sustainable-business-practices': 'staffing-consultancy',
  'customer-experience-digital-age': 'digital-marketing',
  'data-security-best-practices': 'software-it-ai',
  'remote-work-productivity': 'staffing-consultancy',
  'supply-chain-resilience': 'logistics-warehousing',
  'entrepreneurship-startup-success': 'staffing-consultancy',
};

/** StoredImage keys; paths match lib/blog-post-meta.ts */
export const NEWS_CORPUS_IMAGE_KEY_BY_SLUG = {
  'future-of-ecommerce-2026': 'MultiEcommerce.webp',
  'healthcare-technology-innovations': 'medicalfield.webp',
  'sustainable-construction-practices': 'construction.webp',
  'digital-marketing-strategies': 'digital-marketing.webp',
  'ai-transformation-business': 'AI.webp',
  'global-trade-opportunities': 'global-trade.webp',
  'logistics-automation': 'Logistics.webp',
  'workforce-development-skills': 'workforce.webp',
  'media-digital-transformation': 'digital-transformation.webp',
  'manufacturing-industry-4-0': 'industry.webp',
  'food-processing-innovation': 'food.webp',
  'real-estate-investment-tips': 'real-estate.webp',
  'cloud-computing-benefits': 'cloud-computing.webp',
  'telemedicine-healthcare': 'telemedicine.webp',
  'sustainable-business-practices': 'sustainable-business.webp',
  'customer-experience-digital-age': 'customer-experience.webp',
  'data-security-best-practices': 'data-security.webp',
  'remote-work-productivity': 'productivity.webp',
  'supply-chain-resilience': 'supplychains.webp',
  'entrepreneurship-startup-success': 'entrepreneurship.webp',
};
