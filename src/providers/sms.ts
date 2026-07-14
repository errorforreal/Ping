import twilio from "twilio";
import prisma from "../lib/prisma.js";
import { ChannelType } from "../generated/prisma/enums.js";
import type { deliveryHandler } from "./index.js";

export const sendSms: deliveryHandler = async (_delivery, notification, userId) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.SMS_FROM;
    const statusCallback = process.env.TWILIO_STATUS_CALLBACK_URL;

    if (!accountSid || !authToken || !from || !statusCallback) {
        return { success: false, error: "Missing SMS configuration: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, SMS_FROM, or TWILIO_STATUS_CALLBACK_URL" };
    }

    let channelValue: { value: string } | null;
    try {
        channelValue = await prisma.userChannel.findUnique({
            where: {
                userId_type: {
                    userId: userId,
                    type: ChannelType.SMS
                }
            },
            select: {
                value: true
            }
        });

        if (!channelValue) return { success: false, error: "User has no SMS channel configured" };
    } catch (error) {
        return { success: false, error: `Error fetching user channel: ${error}` };
    }

    try {
        const message = await twilio(accountSid, authToken).messages.create({
            from,
            body: notification.title ? `${notification.title}\n ${notification.message}\n\n - Ping` : `${notification.message}\n\n - Ping`,
            to: channelValue.value,
            statusCallback
        });

        if (message.status === "failed" || message.status === "undelivered") {
            return { success: false, error: message.errorMessage ?? `Twilio returned ${message.status}` };
        }

        console.log(`[SMS Provider] Message accepted for user ${userId}: ${message.sid}`);
        return { success: true, providerMessageId : message.sid };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, error: errorMessage };
    }
}
