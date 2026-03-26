-- CreateTable
CREATE TABLE "role_module_permission" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "module" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_module_permission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "role_module_permission_role_idx" ON "role_module_permission"("role");

-- CreateIndex
CREATE UNIQUE INDEX "role_module_permission_role_module_key" ON "role_module_permission"("role", "module");
