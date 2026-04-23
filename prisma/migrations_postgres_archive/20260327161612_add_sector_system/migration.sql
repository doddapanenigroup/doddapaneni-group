-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "sector_id" TEXT;

-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sector_name_key" ON "Sector"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Sector_slug_key" ON "Sector"("slug");

-- CreateIndex
CREATE INDEX "Blog_sector_id_idx" ON "Blog"("sector_id");

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
