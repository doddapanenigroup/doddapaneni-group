import { MetadataRoute } from 'next';

// Base URL - Update this when deploying to production
const BASE_URL = 'https://doddapanenigroup.net';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/about',
    '/services',
    '/blog',
    '/contact',
    '/companies/dealsmedi',
    '/companies/dlsin',
    '/companies/janatha-mirror',
    '/privacy-policy',
    '/terms-conditions',
    '/disclaimer',
    '/faq'
  ];

  const blogSlugs = [
    'future-of-ecommerce-2026',
    'healthcare-technology-innovations',
    'sustainable-construction-practices',
    'digital-marketing-strategies',
    'ai-transformation-business',
    'global-trade-opportunities',
    'logistics-automation',
    'workforce-development-skills',
    'media-digital-transformation',
    'manufacturing-industry-4-0',
    'food-processing-innovation',
    'real-estate-investment-tips',
    'cloud-computing-benefits',
    'telemedicine-healthcare',
    'sustainable-business-practices',
    'customer-experience-digital-age',
    'data-security-best-practices',
    'remote-work-productivity',
    'supply-chain-resilience',
    'entrepreneurship-startup-success'
  ];

  const locales = ['en', 'te', 'hi', 'es', 'bn', 'mr', 'ta', 'gu', 'ur', 'kn', 'or', 'ml', 'pa', 'as', 'mai', 'sat', 'ks'];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  routes.forEach((route) => {
    locales.forEach((locale) => {
      const url = `${BASE_URL}/${locale}${route}`;
      
      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: route === '/blog' ? 'daily' : 'weekly',
        priority: route === '' ? 1 : route === '/blog' ? 0.9 : 0.8,
      });
    });
  });

  // Add blog posts
  blogSlugs.forEach((slug) => {
    locales.forEach((locale) => {
      const url = `${BASE_URL}/${locale}/blog/${slug}`;
      
      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    });
  });

  return sitemapEntries;
}
