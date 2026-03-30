-- Mega menu defaults: four public hubs ON; other eight canonical sectors OFF.
UPDATE "Sector" SET "is_live" = true
WHERE "slug" IN ('software-it-ai', 'digital-marketing', 'healthcare-medical', 'construction-realestate');

UPDATE "Sector" SET "is_live" = false
WHERE "slug" IN (
  'ecommerce-marketplace',
  'media-news-entertainment',
  'staffing-consultancy',
  'food-beverages',
  'manufacturing-trading',
  'logistics-warehousing',
  'education-skill',
  'import-export'
);
