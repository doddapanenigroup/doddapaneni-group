-- CreateTable
CREATE TABLE "user_invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "invited_by_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_invite_email_expires_at_idx" ON "user_invite"("email", "expires_at");

-- CreateIndex
CREATE INDEX "user_invite_invited_by_id_created_at_idx" ON "user_invite"("invited_by_id", "created_at");

-- AddForeignKey
ALTER TABLE "user_invite" ADD CONSTRAINT "user_invite_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
