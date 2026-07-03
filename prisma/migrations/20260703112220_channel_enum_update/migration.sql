/*
  Warnings:

  - The values [SMS] on the enum `ChannelType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ChannelType_new" AS ENUM ('EMAIL', 'WHATSAPP', 'WEBSOCKET');
ALTER TABLE "UserChannel" ALTER COLUMN "type" TYPE "ChannelType_new" USING ("type"::text::"ChannelType_new");
ALTER TABLE "NotificationDelivery" ALTER COLUMN "channel" TYPE "ChannelType_new" USING ("channel"::text::"ChannelType_new");
ALTER TYPE "ChannelType" RENAME TO "ChannelType_old";
ALTER TYPE "ChannelType_new" RENAME TO "ChannelType";
DROP TYPE "public"."ChannelType_old";
COMMIT;
