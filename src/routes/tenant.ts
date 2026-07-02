import express from "express";
import type { Router } from "express";
import { handleLogin, handleSignup, handleRegenerateKey } from "../controller/tenant.js";
import { verifyKey } from "../middleware/apiKey.middleware.js";
import { isRateLimited } from "../services/rateLimiter.js";
import { handleNotify } from "../controller/notification.js";

export const tenantRouter: Router = express.Router();

tenantRouter.post('/login', handleLogin);
tenantRouter.post('/signup', handleSignup);
tenantRouter.post('/rotate', handleRegenerateKey);

tenantRouter.post('/api/notify/v1', verifyKey, isRateLimited, handleNotify);