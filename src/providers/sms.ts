import type { deliveryHandler } from "./email.js";
import twilio from "twilio";
import prisma from "../lib/prisma.js";
import { ChannelType } from "../generated/prisma/enums.js";
import { generateSmsTemplate } from "../utils/smsTemplate.js";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

const from = process.env.SMS_FROM;

export const sendSms: deliveryHandler = async (delivery, notification, userId) => {

    if (!accountSid || !authToken) {
        console.error(`[SMS Provider] AccountSid or AuthToken not set`);
        return { success: false };
    }

    if (!from) {
        console.error(`[SMS Provider] SMS_FROM not set`);
        return { success: false };
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

        if (!channelValue) return { success: false };
    } catch (error) {
        console.error(`[SMS Provider] Error fetching user channel value for user ${userId}: ${error}`);
        return { success: false };
    }

    try {
        const message = await twilioClient.messages.create({
            body: generateSmsTemplate(notification.title, notification.message),
            from,
            to: channelValue.value
        });

        console.log(`[SMS Provider] SMS sent to user ${userId} : ${message.sid}`);
        return { success: true };
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log("Twilio error : ", error);

        return { success: false, error: errorMessage };
        
    }
}