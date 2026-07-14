import express from "express";
import type { Router } from "express";
import { handleLogin, handleSignup, handleRegenerateKey, handleTenantLogout } from "../controller/tenant.js";

import { isLoggedIn } from "../middleware/auth.js";


export const tenantRouter: Router = express.Router();

tenantRouter.post('/login', handleLogin);
tenantRouter.post('/signup', handleSignup);
tenantRouter.post('/rotate', handleRegenerateKey);
tenantRouter.post('/logout', isLoggedIn, handleTenantLogout);
