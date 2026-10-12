import { NextRequest } from "next/server";

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

// In-memory sliding window store
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leak
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (record.resetTime <= now) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000).unref?.();

export interface RateLimitOptions {
    limit?: number;        // Max requests per window (default: 10)
    windowMs?: number;     // Window duration in ms (default: 60,000 = 1 minute)
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetInSeconds: number;
}

export function checkRateLimit(
    request: NextRequest,
    action: string,
    options: RateLimitOptions = {}
): RateLimitResult {
    const limit = options.limit ?? 10;
    const windowMs = options.windowMs ?? 60 * 1000;

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : (request.headers.get("x-real-ip") || "127.0.0.1");
    const key = `${action}:${ip}`;

    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || record.resetTime <= now) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return {
            allowed: true,
            remaining: limit - 1,
            resetInSeconds: Math.ceil(windowMs / 1000),
        };
    }

    if (record.count >= limit) {
        const resetInSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
        return {
            allowed: false,
            remaining: 0,
            resetInSeconds,
        };
    }

    record.count += 1;
    const resetInSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return {
        allowed: true,
        remaining: limit - record.count,
        resetInSeconds,
    };
}
