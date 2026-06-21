-- AlterEnum
ALTER TYPE "NotificationStatus" ADD VALUE 'QUEUED';

-- AlterTable
ALTER TABLE "NotificationDelivery" ADD COLUMN     "providerMessageId" TEXT;
