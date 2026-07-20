import express from "express";
import type { Router } from "express";
import { handleLogin, handleSignup, handleRegenerateKey, handleTenantLogout, handleTenantSession } from "../controller/tenant.js";

import { isLoggedIn } from "../middleware/auth.js";
import { isAuthRateLimited } from "../services/rateLimiter.js";


export const tenantRouter: Router = express.Router();

tenantRouter.post('/login', isAuthRateLimited, handleLogin);
tenantRouter.post('/signup', isAuthRateLimited, handleSignup);
tenantRouter.get('/session', isLoggedIn, handleTenantSession);
tenantRouter.post('/rotate', isLoggedIn, isAuthRateLimited, handleRegenerateKey);
tenantRouter.post('/logout', isLoggedIn, handleTenantLogout);
