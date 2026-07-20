import "dotenv/config";
import { Worker } from "bullmq";
import { connection } from "../queue/connection.js";
import { processNotificationJob } from "./notification.processor.js";
import { notificationQueue } from "../queue/connection.js";
import prisma from "../lib/prisma.js";


export async function startWorker() {

    for (const name of [
        "DATABASE_URL", "REDIS_URL", "SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM",
        "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "SMS_FROM", "TWILIO_STATUS_CALLBACK_URL"
    ]) {
        if (!process.env[name]) throw new Error(`${name} is required`);
    }

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
        jobId: "notification-sweeper",
        repeat: {
            pattern: "*/5 * * * *"
        }
    });

    console.log("Notification Worker started....");

    return notificationWorker;

}

startWorker().then((worker) => {
    let shuttingDown = false;
    const shutdown = async () => {
        if (shuttingDown) return;
        shuttingDown = true;
        await worker.close();
        await notificationQueue.close();
        await prisma.$disconnect();
    };
    process.once("SIGTERM", () => void shutdown());
    process.once("SIGINT", () => void shutdown());
}).catch((error) => {
    console.error(`[Notification Worker] Startup error : ${error.message}`);
    process.exit(1);
})
