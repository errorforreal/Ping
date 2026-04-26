import crypto from "crypto";

export function generateApiKey() {
    const rawKey = crypto.randomBytes(32).toString("hex");
    const hashKey = crypto.createHash("sha256").update(rawKey).digest("hex");

    return { rawKey, hashKey };
}
