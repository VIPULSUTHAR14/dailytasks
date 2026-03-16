import { cookies } from "next/headers";
import { dbcollection } from "@/lib/mongodb";
import { generatetoken } from "@/lib/generatetoken";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const collection = await dbcollection("sessions");
        const sessionToken = cookieStore.get("session_token")?.value;
        if (!sessionToken) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        const hashedToken = crypto.createHash("sha256").update(sessionToken).digest("hex");
        const session = await collection.findOne({ sessionToken: hashedToken });
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const newAccessToken = generatetoken(session._id.toString());
        const newRefreshToken = crypto.randomBytes(32).toString("hex");
        const newhashedRefreshToken = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

        await collection.deleteOne({ _id: session._id })
        await collection.insertOne({
            userID: session.userID,
            tokenHash: newhashedRefreshToken,
            createAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        })

        cookieStore.set("session_token", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return NextResponse.json({ accessToken: newAccessToken })

    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}