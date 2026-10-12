import { cookies } from "next/headers";
import { dbcollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface CachedSession {
    userId: string;
    expiresAt: number;
}

// In-memory cache for active sessions (60s TTL)
const sessionCache = new Map<string, CachedSession>();
const CACHE_TTL_MS = 60 * 1000;

export const SESSION_COOKIE_NAME = "session_token";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

export const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
};

/**
 * Invalidate a session token from the in-memory cache (e.g. on logout or token rotation)
 */
export function invalidateSessionCache(token?: string) {
    if (token) {
        sessionCache.delete(token);
    }
}

/**
 * Clear the entire in-memory session cache
 */
export function clearAllSessionCache() {
    sessionCache.clear();
}

/**
 * Resolves the authenticated user ID from the session_token cookie.
 * Uses an in-memory cache to prevent redundant MongoDB round-trips.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
    const cookieStore = await cookies();
    const hashedToken = cookieStore.get("session_token")?.value;

    if (!hashedToken) {
        return null;
    }

    const now = Date.now();
    const cached = sessionCache.get(hashedToken);
    if (cached) {
        if (cached.expiresAt > now) {
            return cached.userId;
        }
        sessionCache.delete(hashedToken);
    }

    try {
        const sessions = await dbcollection("sessions");
        const session = await sessions.findOne({
            hashedToken,
            ExpireAt: { $gt: new Date() },
        });

        if (!session || !session.userId) {
            return null;
        }

        const sessionDbExpiry = session.ExpireAt instanceof Date ? session.ExpireAt.getTime() : now + CACHE_TTL_MS;
        const cacheExpiresAt = Math.min(now + CACHE_TTL_MS, sessionDbExpiry);

        sessionCache.set(hashedToken, {
            userId: session.userId.toString(),
            expiresAt: cacheExpiresAt,
        });

        return session.userId.toString();
    } catch (error) {
        console.error("Session verification error:", error);
        return null;
    }
}

export interface AuthenticatedUser {
    id: string;
    name: string;
    email: string;
}

/**
 * Resolves safe public profile fields of the currently authenticated user.
 * Strips password hash and sensitive session data.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
        return null;
    }

    try {
        const users = await dbcollection("users");
        let query: Record<string, unknown> = { _id: userId };
        if (ObjectId.isValid(userId)) {
            query = { _id: new ObjectId(userId) };
        }

        const user = await users.findOne(query, {
            projection: { name: 1, email: 1, _id: 1 },
        });

        if (!user) {
            return null;
        }

        return {
            id: user._id.toString(),
            name: user.name || "",
            email: user.email || "",
        };
    } catch (error) {
        console.error("User resolution error:", error);
        return null;
    }
}
