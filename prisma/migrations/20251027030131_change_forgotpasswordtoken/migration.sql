/*
  Warnings:

  - Changed the type of `user_id` on the `ForgotPasswordToken` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ForgotPasswordToken" DROP COLUMN "user_id",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ForgotPasswordToken_user_id_key" ON "ForgotPasswordToken"("user_id");
