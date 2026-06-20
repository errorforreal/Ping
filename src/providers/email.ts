import type { NotificationDelivery, Notification } from "../generated/prisma/client.js";
import  { ChannelType } from "../generated/prisma/enums.js";
import { Resend } from 'resend';
import prisma from "../lib/prisma.js";
import { generateEmailTemplate } from "../services/emailTemplate.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.EMAIL_FROM;


export type deliveryHandler = (delivery: NotificationDelivery, notification: Notification, userId: string) =>
    Promise<{ success: boolean, error?: string }>;

export const sendEmail: deliveryHandler = async (delivery, notification, userId) => {

    if (!from) {
        console.error(`[Email Provider] Email_From not set`);
        return { success: false };
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
        if (!channelValue) return { success: false };

    } catch (error) {
        console.error(`[Email Provider] Error fetching user channel value for user ${userId}: ${error}`);
        return { success: false };
    }

    const { data, error } = await resend.emails.send({
        from,
        to: [channelValue.value],
        subject: notification.title ?? "Do not reply",
        html: generateEmailTemplate(notification.title, notification.message)
    });

    if (error) {
        console.error("Resend error", error);
        return { success: false, error: error.message };
    }

    return { success: true };

}




