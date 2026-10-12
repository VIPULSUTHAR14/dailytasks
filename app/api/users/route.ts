import { getAuthenticatedUser } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json({
            id: user.id,
            name: user.name,
        });
    } catch (error) {
        console.error("Error in /api/users GET:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}