import type { Request, Response } from "express";
import twilio from "twilio";
import prisma from "../lib/prisma.js";
import { DeliveryStatus, NotificationStatus } from "../generated/prisma/enums.js";

async function recomputeNotificationStatus(notificationId: string) {
    const deliveries = await prisma.notificationDelivery.findMany({
        where: { notificationId },
        select: { status: true }
    });

    const status = deliveries.some(({ status }) => status === DeliveryStatus.FAILED)
        ? NotificationStatus.FAILED
        : deliveries.length > 0 && deliveries.every(({ status }) => status === DeliveryStatus.SENT || status === DeliveryStatus.DELIVERED)
            ? NotificationStatus.SENT
            : NotificationStatus.PROCESSING;

    await prisma.notification.update({ where: { id: notificationId }, data: { status } });
}

export async function handleTwilioSmsStatus(req: Request, res: Response) {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const callbackUrl = process.env.TWILIO_STATUS_CALLBACK_URL;
    const signature = req.header("X-Twilio-Signature");
    if (!authToken || !callbackUrl) {
        return res.status(500).json({ message: "Twilio webhook configuration is missing" });
    }
    if (!signature || !twilio.validateRequest(authToken, signature, callbackUrl, req.body)) {
        return res.status(403).json({ message: "Invalid Twilio signature" });
    }

    const providerMessageId = req.body.MessageSid;
    const twilioStatus = String(req.body.MessageStatus ?? "").toLowerCase();
    if (!providerMessageId || !twilioStatus) {
        return res.status(400).json({ message: "MessageSid and MessageStatus are required" });
    }

    const delivery = await prisma.notificationDelivery.findFirst({ where: { providerMessageId } });
    if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
    }

    if (twilioStatus === "delivered") {
        await prisma.notificationDelivery.updateMany({
            where: { id: delivery.id, status: DeliveryStatus.PENDING },
            data: { status: DeliveryStatus.DELIVERED, sentAt: new Date(), error: null }
        });
    } else if (twilioStatus === "failed" || twilioStatus === "undelivered") {
        const error = req.body.ErrorMessage || req.body.ErrorCode || `Twilio reported ${twilioStatus}`;
        await prisma.notificationDelivery.updateMany({
            where: { id: delivery.id, status: DeliveryStatus.PENDING },
            data: { status: DeliveryStatus.FAILED, error: String(error) }
        });
    }

    await recomputeNotificationStatus(delivery.notificationId);
    return res.sendStatus(204);
}
