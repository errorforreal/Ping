/*

this function queries the db, gets the notifications, based on filter : status : PENDING for more than 5minutes, 
then adds them into the queue using the queueEvent function

\*/

import { queueEvent } from "../queue/notification.queue.js";
import prisma from "../lib/prisma.js";
import { NotificationStatus } from "../generated/prisma/enums.js";
import type { Notification } from "../generated/prisma/client.js";


export async function runSweeperLogic(): Promise<{success: boolean , error? : string}> {
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    let stuckNotifications: Notification[];
    try {
        stuckNotifications = await prisma.notification.findMany({
            where: {
                status: NotificationStatus.PENDING,
                createdAt: {
                    lt: fiveMinutesAgo
                }
            }
        });
    } catch (error) {
        return { success: false, error: "Failed to fetch stuckNotifications, check DB connection!" };
    }

    if (!stuckNotifications) return { success: true };

    for (const stuckNotification of stuckNotifications) {

            const { success, jobId, reason } = await queueEvent({
                userId : stuckNotification.userId,
                tenantId: stuckNotification.tenantId,
                notificationId : stuckNotification.id
            });

            if (!success) {
                console.log(`[Notification Sweeper] Failed to enqueue stuck notification : ${stuckNotification.id} : ${reason}`);
                continue;
            }

            console.log(`[Notification Sweeper] Stuck Notification : ${stuckNotification.id} queued : ${jobId}`);
            
            /* now what if notification is queued but db update of the notification from PENDING
            to QUEUED failed !!??? -> doesnt matter, the main part of cron job was to query and try to enqueue!!
            */
    }

    return { success: true };
}
