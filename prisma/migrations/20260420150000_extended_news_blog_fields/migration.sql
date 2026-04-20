-- Blog / news extended fields for marketer dashboard (SEO, categorization, schema, i18n hints).

CREATE TYPE "NewsContentType" AS ENUM ('blog', 'case_study', 'news', 'guide');

ALTER TYPE "NewsStatus" ADD VALUE 'scheduled';
ALTER TYPE "NewsStatus" ADD VALUE 'archived';

ALTER TABLE "news" ADD COLUMN "excerpt" TEXT,
ADD COLUMN "featured_image_alt" TEXT,
ADD COLUMN "banner_image" TEXT,
ADD COLUMN "gallery_image_urls" TEXT,
ADD COLUMN "embedded_video_url" TEXT,
ADD COLUMN "infographic_urls" TEXT,
ADD COLUMN "author_display_name" TEXT,
ADD COLUMN "author_bio" TEXT,
ADD COLUMN "focus_keyword" TEXT,
ADD COLUMN "secondary_keywords" TEXT,
ADD COLUMN "canonical_url" TEXT,
ADD COLUMN "breadcrumb_title" TEXT,
ADD COLUMN "meta_robots" TEXT,
ADD COLUMN "category_slugs" TEXT,
ADD COLUMN "tags" TEXT,
ADD COLUMN "sub_category" TEXT,
ADD COLUMN "content_type" "NewsContentType" NOT NULL DEFAULT 'blog',
ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "like_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "share_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "comments_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "reading_time_minutes" INTEGER,
ADD COLUMN "article_schema_json" TEXT,
ADD COLUMN "faq_schema_json" TEXT,
ADD COLUMN "how_to_schema_json" TEXT,
ADD COLUMN "related_post_slugs" TEXT,
ADD COLUMN "pillar_slug" TEXT,
ADD COLUMN "outbound_links_json" TEXT;

ALTER TABLE "news_translation" ADD COLUMN "excerpt" TEXT,
ADD COLUMN "translated_slug" TEXT,
ADD COLUMN "hreflang_json" TEXT;
