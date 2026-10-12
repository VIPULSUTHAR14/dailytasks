import { NextRequest, NextResponse } from "next/server";

/**
 * Validates request Origin and Referer headers against the host header for state-changing requests (CSRF protection).
 */
export function verifyCsrfOrigin(request: NextRequest): boolean {
    const method = request.method.toUpperCase();
    // Safe idempotent methods do not mutate state
    if (["GET", "HEAD", "OPTIONS"].includes(method)) {
        return true;
    }

    const host = request.headers.get("host");
    const origin = request.headers.get("origin");

    if (origin) {
        try {
            const originHost = new URL(origin).host;
            return originHost === host;
        } catch {
            return false;
        }
    }

    const referer = request.headers.get("referer");
    if (referer) {
        try {
            const refererHost = new URL(referer).host;
            return refererHost === host;
        } catch {
            return false;
        }
    }

    // In development or local tooling (e.g. scripts/curl), allow requests without Origin/Referer
    if (process.env.NODE_ENV !== "production") {
        return true;
    }

    return false;
}

/**
 * Standard CSRF guard response
 */
export function csrfForbiddenResponse() {
    return NextResponse.json(
        { message: "Forbidden: Cross-origin request blocked" },
        { status: 403 }
    );
}
