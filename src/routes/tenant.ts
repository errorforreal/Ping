import express from "express";
import type { Router } from "express";
import { handleLogin, handleSignup } from "../controller/tenant.js"
import { verifyKey } from "../middleware/apiKey.middleware.js"


export const tenantRouter: Router = express.Router();

tenantRouter.post('/login', handleLogin);
tenantRouter.post('/signup', handleSignup);

