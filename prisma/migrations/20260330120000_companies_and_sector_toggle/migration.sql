-- Add sector live toggle
ALTER TABLE "Sector" ADD COLUMN "is_live" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_image" TEXT,
    "description" TEXT,
    "facebook_url" TEXT,
    "instagram_url" TEXT,
    "x_url" TEXT,
    "youtube_url" TEXT,
    "pinterest_url" TEXT,
    "sector_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_slug_key" ON "company"("slug");

-- CreateIndex
CREATE INDEX "company_sector_id_idx" ON "company"("sector_id");

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_sector_id_fkey"
FOREIGN KEY ("sector_id") REFERENCES "Sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

