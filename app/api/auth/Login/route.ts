import { generatetoken } from "@/lib/generatetoken";
import { dbcollection } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const LoginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(4, "Password must be at least 4 characters long"),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = LoginSchema.parse(body);
        const collection = await dbcollection("users");
        const user = await collection.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
        }
        const rawToken = generatetoken(user._id.toString());
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

        const sessionCollection = await dbcollection("sessions");
        await sessionCollection.insertOne({
            userId: user._id.toString(),
            hashedToken,
            CreatedAt: new Date(),
            ExpireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        const cookieStore = await cookies();
        cookieStore.set("session_token", hashedToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return NextResponse.json({ message: "Logged in successfully" }, { status: 200 });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
        }
        console.log(error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}