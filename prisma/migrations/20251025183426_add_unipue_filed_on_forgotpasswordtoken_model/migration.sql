/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `ForgotPasswordToken` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token_hash]` on the table `ForgotPasswordToken` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ForgotPasswordToken" ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "ip_address" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ForgotPasswordToken_user_id_key" ON "ForgotPasswordToken"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ForgotPasswordToken_token_hash_key" ON "ForgotPasswordToken"("token_hash");

-- CreateIndex
CREATE INDEX "ForgotPasswordToken_token_hash_idx" ON "ForgotPasswordToken"("token_hash");

-- CreateIndex
CREATE INDEX "ForgotPasswordToken_expiresAt_idx" ON "ForgotPasswordToken"("expiresAt");
