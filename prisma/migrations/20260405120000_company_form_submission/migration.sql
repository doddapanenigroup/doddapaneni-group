-- CreateTable
CREATE TABLE "company_form_submission" (
    "id" TEXT NOT NULL,
    "form_type" TEXT NOT NULL,
    "company_slug" TEXT,
    "sector_slug" TEXT,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "payload_json" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_form_submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_form_submission_form_type_created_at_idx" ON "company_form_submission"("form_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "company_form_submission_company_slug_created_at_idx" ON "company_form_submission"("company_slug", "created_at" DESC);
