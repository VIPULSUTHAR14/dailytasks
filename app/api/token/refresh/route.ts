import { cookies } from "next/headers";
import { dbcollection } from "@/lib/mongodb";
import { generatetoken } from "@/lib/generatetoken";
import { invalidateSessionCache, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, SESSION_MAX_AGE_MS } from "@/lib/auth/session";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const collection = await dbcollection("sessions");
        const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
        if (!sessionToken) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        
        // Find the active session. The cookie value is hashedToken.
        const session = await collection.findOne({ 
            hashedToken: sessionToken,
            ExpireAt: { $gt: new Date() }
        });
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const newAccessToken = generatetoken(session.userId);
        const newRefreshToken = crypto.randomBytes(32).toString("hex");
        const newhashedRefreshToken = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

        // Cycle the session
        invalidateSessionCache(sessionToken);
        await collection.deleteOne({ _id: session._id })
        await collection.insertOne({
            userId: session.userId,
            hashedToken: newhashedRefreshToken,
            CreatedAt: new Date(),
            ExpireAt: new Date(Date.now() + SESSION_MAX_AGE_MS)
        })

        // Set the new session token cookie
        cookieStore.set(SESSION_COOKIE_NAME, newhashedRefreshToken, SESSION_COOKIE_OPTIONS);

        return NextResponse.json({ accessToken: newAccessToken })

    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}