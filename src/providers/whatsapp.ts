import twilio from "twilio";
import prisma from "../lib/prisma.js";
import { ChannelType } from "../generated/prisma/enums.js";
import { generateWhatsappTemplate } from "../utils/whatsappTemplate.js";
import type { deliveryHandler } from "./index.js";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

const from = process.env.MESSAGE_FROM;

export const sendMessage: deliveryHandler = async (delivery, notification, userId) => {

    if (!accountSid || !authToken) {
        return { success: false, error: "AccountSid or AuthToken not set" };
    }

    if (!from) {
        return { success: false, error: "MESSAGE_FROM not set" };
    }

    let channelValue: { value: string } | null;
    try {
        channelValue = await prisma.userChannel.findUnique({
            where: {
                userId_type: {
                    userId: userId,
                    type: ChannelType.WHATSAPP
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
            body: generateWhatsappTemplate(notification.title, notification.message),
            from,
            to: channelValue.value
        });

        console.log(`[Whatsapp Provider] Message sent to user ${userId} : ${message.sid}`);
        return { success: true, providerMessageId : message.sid };
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, error: errorMessage };
    }
}