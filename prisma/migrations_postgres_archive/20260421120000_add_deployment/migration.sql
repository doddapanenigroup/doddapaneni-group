-- CreateTable
CREATE TABLE "deployment" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "logs" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deployment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deployment_created_at_idx" ON "deployment"("created_at" DESC);
