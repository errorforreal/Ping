import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import generateToken from "../services/auth";


export async function handleLogin(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
        
        const tenant = await prisma.tenant.findUnique({
            where: {
                email: email
            }
        })

        if (!tenant) return res.status(401).json({ message: "Invalid email or password" });

        const isValidPass: boolean = await bcrypt.compare(password, tenant.password);

        if (!isValidPass) return res.status(401).json({ message: "Invalid email or password" });

        const token = generateToken({ id: tenant.id, role: tenant.role });
        return res.status(200).json({ message: token });
    }
    catch (err) {
        return res.json({ message: "Internal server error" });
    }
}