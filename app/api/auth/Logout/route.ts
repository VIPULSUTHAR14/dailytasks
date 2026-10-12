import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { dbcollection } from "@/lib/mongodb";
import { invalidateSessionCache } from "@/lib/auth/session";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const tokenValue = cookieStore.get("session_token")?.value;
        const session = await dbcollection("sessions");
        if (tokenValue) {
            invalidateSessionCache(tokenValue);
            await session.deleteOne({ hashedToken: tokenValue });
        }
        cookieStore.delete("session_token");
        return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}   