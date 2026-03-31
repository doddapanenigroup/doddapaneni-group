-- Rename Blog → news, blog_translation → news_translation, BlogStatus → NewsStatus (PostgreSQL, data-preserving).

ALTER TABLE "blog_translation" DROP CONSTRAINT IF EXISTS "blog_translation_blog_id_fkey";

ALTER TYPE "BlogStatus" RENAME TO "NewsStatus";

ALTER TABLE "Blog" RENAME TO "news";
ALTER TABLE "news" RENAME CONSTRAINT "Blog_pkey" TO "news_pkey";
ALTER TABLE "news" RENAME CONSTRAINT "Blog_author_id_fkey" TO "news_author_id_fkey";
ALTER TABLE "news" RENAME CONSTRAINT "Blog_sector_id_fkey" TO "news_sector_id_fkey";

ALTER INDEX "Blog_slug_key" RENAME TO "news_slug_key";
ALTER INDEX "Blog_author_id_idx" RENAME TO "news_author_id_idx";
ALTER INDEX "Blog_sector_id_idx" RENAME TO "news_sector_id_idx";

ALTER TABLE "blog_translation" RENAME TO "news_translation";
ALTER TABLE "news_translation" RENAME CONSTRAINT "blog_translation_pkey" TO "news_translation_pkey";
ALTER TABLE "news_translation" RENAME COLUMN "blog_id" TO "news_id";
ALTER INDEX "blog_translation_blog_id_locale_key" RENAME TO "news_translation_news_id_locale_key";
ALTER INDEX "blog_translation_blog_id_idx" RENAME TO "news_translation_news_id_idx";

ALTER TABLE "news_translation" ADD CONSTRAINT "news_translation_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;
