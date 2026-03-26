-- CreateTable
CREATE TABLE "task_execution_log" (
    "id" TEXT NOT NULL,
    "task_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "message" TEXT,
    "details_json" TEXT,

    CONSTRAINT "task_execution_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_execution_log_task_name_started_at_idx" ON "task_execution_log"("task_name", "started_at");

-- CreateIndex
CREATE INDEX "task_execution_log_started_at_idx" ON "task_execution_log"("started_at");
