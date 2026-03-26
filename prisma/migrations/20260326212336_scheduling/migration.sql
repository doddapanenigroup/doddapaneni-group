-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "scheduled_publish_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PageContent" ADD COLUMN     "scheduled_publish_at" TIMESTAMP(3);
