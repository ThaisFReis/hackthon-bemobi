/*
  Warnings:

  - You are about to drop the column `displayName` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethodType` on the `payment_methods` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."payment_methods" DROP COLUMN "displayName",
DROP COLUMN "paymentMethodType",
ADD COLUMN     "cardBrand" VARCHAR(50),
ADD COLUMN     "cardType" "public"."CardType";
