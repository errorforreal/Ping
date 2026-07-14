ALTER TYPE "ChannelType" RENAME VALUE 'WHATSAPP' TO 'SMS';

ALTER TYPE "DeliveryStatus" ADD VALUE 'DELIVERED';

CREATE INDEX "NotificationDelivery_providerMessageId_idx" ON "NotificationDelivery"("providerMessageId");
