import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";


export type authTenant = {
    id: string,
    role: string
}
export type authPayload = {
    tenantId: string,
    role: string
}

export function generateToken(tenant: authTenant):string {
    const payload: authPayload = {
        tenantId: tenant.id,
        role : tenant.role
    }

    const expiresIn = process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"] | undefined;
    const options: SignOptions = expiresIn ? { expiresIn } : {};

    return jwt.sign(payload,
        process.env.JWT_SECRET as string ,
       options
    )
}

export function validateToken(token: string): authPayload {
    try {
        return jwt.verify(token, process.env.JWT_SECRET as string) as authPayload;
    } catch (err) {
        throw new Error("Invalid Token");
        
    }
}

