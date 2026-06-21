import type { NotificationDelivery, Notification } from "../generated/prisma/client.js";
import  { ChannelType } from "../generated/prisma/enums.js";
import { Resend } from 'resend';
import prisma from "../lib/prisma.js";
import { generateEmailTemplate } from "../utils/emailTemplate.js";
import type { deliveryHandler } from "./index.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.EMAIL_FROM;



export const sendEmail: deliveryHandler = async (delivery, notification, userId) => {

    if (!from) {
        return { success: false, error: "EMAIL_FROM not set" };
    }

    let channelValue: {value : string} | null;
    try {
        channelValue = await prisma.userChannel.findUnique({
            where: {
                userId_type: {
                    userId: userId,
                    type: ChannelType.EMAIL
                }
            },
            select: {
                value: true
            }
        });
        if (!channelValue) return { success: false, error: "User has no EMAIL channel configured" };

    } catch (error) {
        return { success: false, error: `Error fetching user channel: ${error}` };
    }

    const { data, error } = await resend.emails.send({
        from,
        to: [channelValue.value],
        subject: notification.title ?? "Do not reply",
        html: generateEmailTemplate(notification.title, notification.message)
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };

}

