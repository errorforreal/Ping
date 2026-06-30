import express from "express";
import type { Router } from "express";
import { getAnalytics } from "../controller/analytics.js";
import { isLoggedIn } from "../middleware/auth.js";

export const analyticsRouter: Router = express.Router();

analyticsRouter.get('/', isLoggedIn, getAnalytics);
