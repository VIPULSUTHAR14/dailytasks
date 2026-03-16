import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ProtectedRoutes = ["/dashboard"];
const PublicRoutes = ["/Login", "/signup", "/"];

export async function proxy(request: NextRequest) {
    const cookieStore = await cookies();
    const path = request.nextUrl.pathname;
    if (path.startsWith("/_next") || path.startsWith("/api") || path.includes(".")) {
        return NextResponse.next();
    }

    const hashedToken = cookieStore.get("session_token")?.value;
    const isTokenPresent = !!hashedToken;

    if (path === "/" && !isTokenPresent) {
        return NextResponse.redirect(new URL("/Login", request.url));
    }

    const isProtectedRoute = ProtectedRoutes.some(p => path.toLowerCase() === p);
    const isPublicRoute = PublicRoutes.some(p => path.toLowerCase() === p);

    if (isProtectedRoute && !isTokenPresent) {
        return NextResponse.redirect(new URL("/Login", request.url));
    }

    if (isPublicRoute && isTokenPresent) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}