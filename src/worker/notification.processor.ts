import type { Job } from "bullmq";
import prisma from "../lib/prisma.js";

/*
what should this function do???

when a notification req comes -> we push it into the queue -> we push the notification id and user id -> 
now the worker fetches deliveries using notification id, now suppose there are 2 deliveries, email and phone, if email 
succeeds and worker crashes or phone fails, job is marked as failed, when worker again fetches the deliveries, it should 
handle this edge case of not sending the email notification again

*/


export async function processNotificationJob(job: Job) {
    
    const { notificationId, userId } = job.data; 

    const { deliveries, notification }  = await prisma.$transaction(
        async (tx) => {

            const deliveries = await tx.notificationDelivery.findMany({
                where: {
                    notificationId: notificationId
                }
            });

            const notification = await tx.notification.findUnique({
                where: {
                    id: notificationId
                },
                select: {
                    title: true,
                    message: true
                }
            })

            return { deliveries, notification };
        }
    )

    if (!notification) {
        console.error(`[Notification Processor] Notification not found for id: ${notificationId}`);
        return;
    }

    if (!deliveries) {
        console.error(`[Notification Processor] No deliveries found for notification id: ${notificationId}`);
        return;
    }


      
}