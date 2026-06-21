import { notificationQueue } from "./connection.js";
import prisma from "../lib/prisma.js";
import { NotificationStatus } from "../generated/prisma/enums.js";
import { Prisma } from "../generated/prisma/client.js";

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

        await prisma.notification.update({
            where: {
                id : notificationId
            },
            data: {
                status : NotificationStatus.QUEUED
            }
        })
    
        return { success: true, jobId: bullJobId };

    } catch (error) {
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`[Notification Queue] Failed to update Notification Status for ${notificationId} but enqueue success`);
            return { success: true,  jobId: bullJobId };
            
        }

        const message = error instanceof Error ? error.message : String(error);
        console.error("[Notification Queue] Enqueue error:", message);
        
        return { success: false, reason: 'enqueue error' };
    }

}