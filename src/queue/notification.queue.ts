import { notificationQueue } from "./connection.js";
import  prisma  from "../lib/prisma.js";

type queueParams = {
    userId?: string,
    tenantId?: string,
    notificationId?: string
}



function generateIdempotencyKey({ userId, notificationId }: {userId: string, notificationId: string}): string{
    return `ping:notification:${userId}:${notificationId}`;
}

export async function queueEvent({userId, tenantId, notificationId}: queueParams) {
    if (!userId || !tenantId || !notificationId) {
        return {
            success: false
        }
    }

    const idempotencyKey = generateIdempotencyKey({ userId, notificationId });
    // const notification = await prisma.notification.update({

    // })


}