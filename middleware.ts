import { NextRequest, NextResponse } from "next/server";
import { dbcollection } from "@/lib/mongodb";
import { cookies } from "next/headers";

const ProtectedRoutes = ["/dashboard"];
const PublicRoutes = ["/Login", "/signup", "/"];

export async function middleware(request: NextRequest) {
    const cookieStore = await cookies();
    const path = request.nextUrl.pathname;
    if (path === "/" && !cookieStore.get("session_token")) {
        return NextResponse.redirect(new URL("/Login", request.url));
    }
    const isProtectedRoute = ProtectedRoutes.some(p => path.toLowerCase() === p);
    const isPublicRoute = PublicRoutes.some(p => path.toLowerCase() === p);
    const hashedToken = cookieStore.get("session_token")?.value;
    let isTokenValid = false;

    if (hashedToken) {
        try {
            const sessions = await dbcollection("sessions");
            const session = await sessions.findOne({
                hashedToken,
                ExpireAt: { $gt: new Date() },
            });
            isTokenValid = !!session;
        } catch {
            isTokenValid = false;
        }
    }

    if (isProtectedRoute && !isTokenValid) {
        return NextResponse.redirect(new URL("/Login", request.url));
    }

    if (isPublicRoute && isTokenValid) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\.png$).*)'],
}