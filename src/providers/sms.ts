import twilio from "twilio";
import prisma from "../lib/prisma.js";
import { ChannelType } from "../generated/prisma/enums.js";
import { generateSmsTemplate } from "../utils/smsTemplate.js";
import type { deliveryHandler } from "./index.js";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

const from = process.env.SMS_FROM;

export const sendSms: deliveryHandler = async (delivery, notification, userId) => {

    if (!accountSid || !authToken) {
        return { success: false, error: "AccountSid or AuthToken not set" };
    }

    if (!from) {
        return { success: false, error: "SMS_FROM not set" };
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
        const message = await twilioClient.messages.create({
            body: generateSmsTemplate(notification.title, notification.message),
            from,
            to: channelValue.value
        });

        console.log(`[SMS Provider] SMS sent to user ${userId} : ${message.sid}`);
        return { success: true, providerMessageId : message.sid };
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, error: errorMessage };
    }
}