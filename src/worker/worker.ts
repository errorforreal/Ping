import { Worker } from "bullmq";
import { connection } from "../queue/connection.js";
import { workerLogic } from "./notification.processor.js";

const notificationWorker = new Worker("notifications",
    workerLogic,
    {
        connection,
        concurrency : 5
    }
);