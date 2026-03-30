-- CreateTable
CREATE TABLE "blog_translation" (
    "id" TEXT NOT NULL,
    "blog_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "og_title" TEXT,
    "og_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_translation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_translation_blog_id_locale_key" ON "blog_translation"("blog_id", "locale");

-- CreateIndex
CREATE INDEX "blog_translation_blog_id_idx" ON "blog_translation"("blog_id");

-- AddForeignKey
ALTER TABLE "blog_translation" ADD CONSTRAINT "blog_translation_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
