-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_email" TEXT,
    "user_role" TEXT,
    "path" TEXT,
    "method" TEXT,
    "status_code" INTEGER,
    "error_type" TEXT,
    "message" TEXT NOT NULL,
    "stack_trace" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ErrorLog_created_at_idx" ON "ErrorLog"("created_at");
