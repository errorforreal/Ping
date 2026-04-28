import express from "express";
import type { Router, Request, Response } from "express";
import path from "path";

export const tenantRouter: Router = express.Router();

tenantRouter.get('/', (req: Request, res: Response) => {
    return res.sendFile(path.resolve("frontend/login/login.html"))
})

tenantRouter.get('/login', (req: Request, res: Response) => {
    return res.sendFile(path.resolve("frontend/login/login.html"))
})

tenantRouter.get('/signup', (req: Request, res: Response) => {
    return res.sendFile(path.resolve("frontend/signup/signup.html"))
})