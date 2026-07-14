import "dotenv/config";
import express from "express";
import { tenantRouter } from "./routes/tenant.js";
import "./worker/worker.js";


import { analyticsRouter } from "./routes/analytics.js";
import { handleNotify } from "./controller/notification.js";
import { verifyKey } from "./middleware/apiKey.middleware.js";
import { isRateLimited } from "./services/rateLimiter.js";
import { handleTwilioSmsStatus } from "./controller/twilioWebhook.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended : false}));

app.use("/tenant", tenantRouter);
app.use("/analytics", analyticsRouter);
app.post("/api/webhooks/twilio/sms-status", handleTwilioSmsStatus);
app.post("/api/notify/v1", verifyKey, isRateLimited, handleNotify);


const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log("Server is listening...");
    
})
