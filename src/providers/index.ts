import { sendSms } from "./sms.js";
import { sendEmail } from "./email.js";
import { ChannelType } from "../generated/prisma/enums.js";
import type { NotificationDelivery, Notification } from "../generated/prisma/client.js";

export type deliveryHandler = (delivery: NotificationDelivery, notification: Notification, userId: string) =>
    Promise<{ success: boolean, error?: string, providerMessageId? : string }>;

export const ChannelProvider: Record<ChannelType, deliveryHandler> = {
    [ChannelType.SMS]: sendSms,
    [ChannelType.EMAIL]: sendEmail,
    [ChannelType.WEBSOCKET]: async () => {
        console.log("[Websocket Provider] This channel delivery is not implemented yet.");
        return { success: false, error: "Channel delivery not implemented yet." };
    }
};