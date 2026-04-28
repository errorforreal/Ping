import "dotenv/config";
import express from "express";
import path from "path";
import { tenantRouter } from "./routes/tenant.js";




const app = express();




app.use(express.json());
app.use(express.urlencoded({extended : false}));
app.use(express.static(path.resolve('frontend')));
app.use("/tenant", tenantRouter);









const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log("Server is listening...");
    
})