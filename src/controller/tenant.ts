import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import { generateToken } from "../services/auth.js";
import { generateApiKey } from "../services/apiKey.js";
import { redis } from "../lib/redis.js";


export async function handleLogin(req: Request, res: Response) {
    const { email, password }: { email?: string; password?: string } = req.body;
    if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        
        email.toLowerCase();   
        const tenant = await prisma.tenant.findUnique({
            where: {
                email: email
            }
        })

        if (!tenant) return res.status(401).json({ message: "Invalid email or password" });

        const isValidPass = await bcrypt.compare(password, tenant.password);

        if (!isValidPass) return res.status(401).json({ message: "Invalid email or password" });

        const token = generateToken({ id: tenant.id, role: tenant.role });
        return res.status(200).json({ message: token });
    }
    catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
}



export async function handleSignup(req: Request, res: Response) {
    const { name, email, password }: { name?: string; email?: string; password?: string } = req.body;
     if (!email || !password || !name) {
    return res.status(400).json({ message: "Email,password and name are required" });
    }

    try {
        const { rawKey, hashKey } = generateApiKey();
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.tenant.create({
            data: {
                name: name,
                email: email,
                password: passwordHash,
                apiKey: hashKey
            }
        });
        return res.status(201).json({
            message: "Tenant created successfully",
            apiKey: rawKey
        });
    }
    catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function handleRegenerateKey(req: Request, res: Response) {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    try {
        email.toLowerCase();
        const tenant = await prisma.tenant.findUnique({ where: { email } });
        if (!tenant) return res.status(401).json({ message: "Invalid email or password" });

        const isValidPass = await bcrypt.compare(password, tenant.password);
        if (!isValidPass) return res.status(401).json({ message: "Invalid email or password" });

        const { rawKey, hashKey } = generateApiKey();
        await prisma.tenant.update({
            where: { id: tenant.id },
            data: { apiKey: hashKey }
        });

        console.log("[API Key] successfully changed for tenant : ", tenant.id);
        
        return res.status(200).json({ message: "Key regenerated", apiKey: rawKey });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function handleTenantLogout(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(400).json({ message: "Token is required!" });

    try {
        const token = authHeader.split('Bearer ')[1];
        if (token) {
            // Blacklist the token in Redis for 7 days
            await redis.set(`bl_${token}`, "revoked", "EX", 7 * 24 * 60 * 60);
        }
        return res.status(200).json({ message: "Logged out successfully" });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }

    
}