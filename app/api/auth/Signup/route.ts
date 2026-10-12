import { generatetoken } from "@/lib/generatetoken";
import { dbcollection } from "@/lib/mongodb";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, SESSION_MAX_AGE_MS } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import crypto from "crypto";
import { cookies } from "next/headers";

const userSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(4, "Password must be at least 4 characters long"),
})

const sessionSchema = z.object({
    userId: z.string(),
    hashedToken: z.string(),
    CreatedAt: z.date(),
    ExpireAt: z.date(),
})
export async function POST(request: NextRequest) {
    try {
        const rateCheck = checkRateLimit(request, "auth_signup", { limit: 10, windowMs: 60 * 1000 });
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { message: "Too many signup attempts. Please try again later." },
                { status: 429, headers: { "Retry-After": rateCheck.resetInSeconds.toString() } }
            );
        }

        const body = await request.json();
        const { name, email, password } = userSchema.parse(body);
        const hashedpassword = await bcrypt.hash(password, 10);
        const collection = await dbcollection("users");
        const session = await dbcollection("sessions");
        const userExist = await collection.findOne({ email });
        if (userExist) {
            return NextResponse.json({ message: "user Already Exists" }, { status: 409 })
        }
        const userdata = await collection.insertOne({ name, email, password: hashedpassword });
        const rawToken = generatetoken(userdata.insertedId.toString());
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
        const sessiondata = sessionSchema.parse({
            userId: userdata.insertedId.toString(),
            hashedToken: hashedToken,
            CreatedAt: new Date(),
            ExpireAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
        })
        await session.insertOne(sessiondata);

        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, hashedToken, SESSION_COOKIE_OPTIONS);
        return NextResponse.json({ message: "User Created Successfully" }, { status: 201 })
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
        }
        console.log(error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}