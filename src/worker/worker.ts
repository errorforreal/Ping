import { Worker } from "bullmq";
import { connection } from "../queue/connection.js";
import { processNotificationJob } from "./notification.processor.js";
import { notificationQueue } from "../queue/connection.js";


export async function startWorker() {

    console.log("Notification Worker starting....");
    
    const notificationWorker = new Worker("notifications", processNotificationJob, {
            connection,
            concurrency : 5
        }
    );

    notificationWorker.on('completed', (job) => {
        console.log(`[Notification Woker] Job ${job.id} completed successfully.`);
    })

    notificationWorker.on('failed', (job, err) => {
        if (!job) return;
        console.log(`[Notification Worker] Job ${job.id} failed, ${err.message}`);
    })

    await notificationQueue.add('sweeper-job', {}, {
        repeat: {
            pattern: "*/5 * * * *"
        }
    });

}

startWorker().catch((error) => {
    console.error(`[Notification Worker] Startup error : ${error.message}`);
    process.exit(1);
})