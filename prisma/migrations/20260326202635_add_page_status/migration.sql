-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('draft', 'published');

-- AlterTable
ALTER TABLE "PageContent" ADD COLUMN     "status" "PageStatus" NOT NULL DEFAULT 'published';
