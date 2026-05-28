import { redis }  from "../lib/redis.js"

export async function getCachedKey<T>(key: string): Promise<T | null> {
    const cachedKey = await redis.get(`apikey:${key}`);

    return cachedKey ? (JSON.parse(cachedKey) as T) : null;
}

