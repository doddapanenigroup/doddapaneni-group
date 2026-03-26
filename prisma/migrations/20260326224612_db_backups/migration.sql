-- CreateTable
CREATE TABLE "db_backup" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "created_by_email" TEXT,
    "created_by_role" TEXT,
    "label" TEXT,
    "format" TEXT NOT NULL DEFAULT 'json',
    "include_media" BOOLEAN NOT NULL DEFAULT false,
    "sha256" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "data_json" TEXT NOT NULL,

    CONSTRAINT "db_backup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "db_backup_created_at_idx" ON "db_backup"("created_at");

-- CreateIndex
CREATE INDEX "db_backup_created_by_id_created_at_idx" ON "db_backup"("created_by_id", "created_at");
