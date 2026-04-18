-- CreateTable
CREATE TABLE "career_job" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "PageStatus" NOT NULL DEFAULT 'published',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_job_translation" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "apply_label" TEXT NOT NULL DEFAULT 'Apply',
    "apply_url" TEXT NOT NULL,

    CONSTRAINT "career_job_translation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "career_job_slug_key" ON "career_job"("slug");

-- CreateIndex
CREATE INDEX "career_job_translation_locale_idx" ON "career_job_translation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "career_job_translation_job_id_locale_key" ON "career_job_translation"("job_id", "locale");

-- AddForeignKey
ALTER TABLE "career_job_translation" ADD CONSTRAINT "career_job_translation_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "career_job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
