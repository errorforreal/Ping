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
                id: notificationId
            },
            data: {
                idempotencyKey: idempotencyKey,
                bullJobId: bullJobId
            }
        });
    } catch (dbError) {
        const message = dbError instanceof Error ? dbError.message : String(dbError);
        console.error("[Notification Queue] DB error: ", message);
        return { success: false, reason: 'db_error' };
    }

    try {
        const job = await notificationQueue.add('notification-event', {
            notificationId: notificationId,
            userId: userId
        }, {
            jobId: bullJobId
        });
    
        return { success: true, jobId: bullJobId };
    } catch (enqueueError) {
        const message = enqueueError instanceof Error ? enqueueError.message : String(enqueueError);
        console.error("[Notification Queue] Enqueue error:", message);
        
        return { success: false, reason: 'enqueue error' };
    }

}