-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'DIGITAL_MARKETER');

-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'active', 'paused', 'ended');

-- CreateEnum
CREATE TYPE "MarketingLinkType" AS ENUM ('tool', 'integration', 'resource', 'other');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'DEVELOPER',
    "created_by_id" TEXT,
    "created_at_ist" TEXT,
    "created_at_et" TEXT,
    "password_changed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_employee_create_otp" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_employee_create_otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginEmailOtp" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginEmailOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logged_at_ist" TEXT NOT NULL,
    "logged_at_et" TEXT NOT NULL,
    "logged_out_at" TIMESTAMP(3),
    "logged_out_at_ist" TEXT,
    "logged_out_at_et" TEXT,

    CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordChangeLog" (
    "id" TEXT NOT NULL,
    "changed_by_id" TEXT NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "changed_by_role" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at_ist" TEXT NOT NULL,
    "changed_at_et" TEXT NOT NULL,

    CONSTRAINT "PasswordChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "visited_at" TIMESTAMP(3) NOT NULL,
    "visited_at_ist" TEXT NOT NULL,
    "visited_at_et" TEXT NOT NULL,
    "ip_address" TEXT,
    "page_path" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardVisit" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "visited_at" TIMESTAMP(3) NOT NULL,
    "visited_at_ist" TEXT NOT NULL,
    "visited_at_et" TEXT NOT NULL,
    "user_agent" TEXT,

    CONSTRAINT "DashboardVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperPageView" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "login_log_id" TEXT,
    "path" TEXT NOT NULL,
    "visited_at" TIMESTAMP(3) NOT NULL,
    "visited_at_ist" TEXT NOT NULL,
    "visited_at_et" TEXT NOT NULL,
    "user_agent" TEXT,

    CONSTRAINT "DeveloperPageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageContent" (
    "id" TEXT NOT NULL,
    "page_key" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "keywords" TEXT,
    "canonical_url" TEXT,
    "og_title" TEXT,
    "og_description" TEXT,
    "og_image" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "featured_image" TEXT,
    "author_id" TEXT NOT NULL,
    "status" "BlogStatus" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),
    "meta_title" TEXT,
    "meta_description" TEXT,
    "keywords" TEXT,
    "og_title" TEXT,
    "og_description" TEXT,
    "og_image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingLink" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" "MarketingLinkType" NOT NULL DEFAULT 'resource',
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentEditLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "user_role" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "target_path" TEXT NOT NULL,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentEditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingActivityLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "user_role" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "seo_note" TEXT,
    "payload_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebVitalReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "rating" TEXT,
    "delta" DOUBLE PRECISION,
    "id_metric" TEXT,
    "navigation_type" TEXT,
    "page_path" TEXT,
    "user_id" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebVitalReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stored_image" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "alt_text" TEXT,
    "file_name" TEXT,
    "size" INTEGER,
    "mime_type" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stored_image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "admin_employee_create_otp_admin_user_id_expires_at_idx" ON "admin_employee_create_otp"("admin_user_id", "expires_at");

-- CreateIndex
CREATE INDEX "LoginEmailOtp_user_id_expires_at_idx" ON "LoginEmailOtp"("user_id", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "PageContent_slug_key" ON "PageContent"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PageContent_page_key_locale_key" ON "PageContent"("page_key", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");

-- CreateIndex
CREATE INDEX "Blog_author_id_idx" ON "Blog"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "stored_image_key_key" ON "stored_image"("key");

-- AddForeignKey
ALTER TABLE "admin_employee_create_otp" ADD CONSTRAINT "admin_employee_create_otp_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginEmailOtp" ADD CONSTRAINT "LoginEmailOtp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginLog" ADD CONSTRAINT "LoginLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordChangeLog" ADD CONSTRAINT "PasswordChangeLog_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeveloperPageView" ADD CONSTRAINT "DeveloperPageView_login_log_id_fkey" FOREIGN KEY ("login_log_id") REFERENCES "LoginLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
