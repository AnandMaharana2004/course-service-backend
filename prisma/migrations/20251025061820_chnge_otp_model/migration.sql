/*
  Warnings:

  - You are about to drop the column `code` on the `Otp` table. All the data in the column will be lost.
  - Added the required column `otp` to the `Otp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Otp" DROP COLUMN "code",
ADD COLUMN     "otp" INTEGER NOT NULL;
