import { generatetoken } from "@/lib/generatetoken";
import { dbcollection } from "@/lib/mongodb";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, SESSION_MAX_AGE_MS } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rateLimit";
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
        const rateCheck = checkRateLimit(request, "auth_login", { limit: 10, windowMs: 60 * 1000 });
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { message: "Too many login attempts. Please try again later." },
                { status: 429, headers: { "Retry-After": rateCheck.resetInSeconds.toString() } }
            );
        }

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
            ExpireAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
        });

        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, hashedToken, SESSION_COOKIE_OPTIONS);

        return NextResponse.json({ message: "Logged in successfully" }, { status: 200 });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
        }
        console.log(error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}