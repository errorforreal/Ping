import express from "express";
import type { Router, Request, Response } from "express";
import {handleLogin, handleSignup} from "../controller/tenant.js"


export const tenantRouter: Router = express.Router();

tenantRouter.post('/login', handleLogin);
tenantRouter.post('/signup', handleSignup);

