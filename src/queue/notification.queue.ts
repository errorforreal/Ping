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

function generateBullJobId(idempotencyKey: string) {
    return idempotencyKey.replace(/:/g, '-');
}

export async function queueEvent({userId, tenantId, notificationId}: queueParams) {
    if (!userId || !tenantId || !notificationId) {
        return {
            success: false
        }
    }

    const idempotencyKey: string = generateIdempotencyKey({ userId, notificationId });
    const bullJobId: string = generateBullJobId(idempotencyKey);

    try {
        
        const notification = await prisma.notification.update({
            where: {
                id : notificationId
            },
            data: {
                status: "PROCESSING",
                bullJobId : bullJobId
            }
        })

        
    } catch (error) {
        
    }


}