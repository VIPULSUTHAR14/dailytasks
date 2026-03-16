import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { dbcollection } from "@/lib/mongodb";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const session = await dbcollection("sessions");
        await session.deleteOne({ hashedToken: cookieStore.get("session_token")?.value });
        cookieStore.delete("session_token");
        return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}   