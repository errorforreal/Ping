/*
  Warnings:

  - The values [SMS] on the enum `ChannelType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `verified` on the `UserChannel` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,type]` on the table `UserChannel` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ChannelType_new" AS ENUM ('EMAIL', 'PHONE', 'WEBSOCKET');
ALTER TABLE "UserChannel" ALTER COLUMN "type" TYPE "ChannelType_new" USING ("type"::text::"ChannelType_new");
ALTER TABLE "NotificationDelivery" ALTER COLUMN "channel" TYPE "ChannelType_new" USING ("channel"::text::"ChannelType_new");
ALTER TYPE "ChannelType" RENAME TO "ChannelType_old";
ALTER TYPE "ChannelType_new" RENAME TO "ChannelType";
DROP TYPE "public"."ChannelType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "NotificationStatus" ADD VALUE 'Processing';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "bullJobId" TEXT,
ADD COLUMN     "idempotencyKey" TEXT;

-- AlterTable
ALTER TABLE "UserChannel" DROP COLUMN "verified";

-- CreateIndex
CREATE UNIQUE INDEX "UserChannel_userId_type_key" ON "UserChannel"("userId", "type");
