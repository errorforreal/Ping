import "dotenv/config";
import express from "express";
import { tenantRouter } from "./routes/tenant.js";



import { analyticsRouter } from "./routes/analytics.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended : false}));

app.use("/tenant", tenantRouter);
app.use("/analytics", analyticsRouter);


const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log("Server is listening...");
    
})