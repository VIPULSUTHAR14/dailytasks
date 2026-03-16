import { dbcollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import z from "zod";

const aptitudeSchema = z.object({
    statuses: z.record(z.string(), z.enum(["Not Started", "In Progress", "Mastered"])).optional(),
});

// Helper to reliably extract the authenticated user from the session cookie
async function getAuthenticatedUserId(): Promise<string | null> {
    const cookieStore = await cookies();
    const hashedToken = cookieStore.get("session_token")?.value;

    if (!hashedToken) return null;

    try {
        const sessions = await dbcollection("sessions");
        const session = await sessions.findOne({
            hashedToken,
            ExpireAt: { $gt: new Date() },
        });

        return session ? session.userId : null;
    } catch {
        return null;
    }
}

export async function GET() {
    try {
        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const data = await dbcollection("aptitude");
        const aptitude = await data.findOne({ user_id });

        if (!aptitude) {
            return NextResponse.json({ statuses: {} }, { status: 200 });
        }

        return NextResponse.json({ statuses: aptitude.statuses || {} }, { status: 200 });
    } catch (error: unknown) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { statuses } = aptitudeSchema.parse(body);
        const data = await dbcollection("aptitude");

        const newAptitude = {
            user_id,
            statuses: statuses || {},
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await data.updateOne(
            { user_id },
            { $set: newAptitude },
            { upsert: true }
        );

        return NextResponse.json({ message: "Aptitude tracking initialized", result }, { status: 201 });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { statuses } = aptitudeSchema.parse(body);
        const data = await dbcollection("aptitude");

        const setPayload: Record<string, any> = { updated_at: new Date() };

        if (statuses) {
            for (const [key, val] of Object.entries(statuses)) {
                setPayload[`statuses.${key}`] = val;
            }
        }

        const result = await data.updateOne(
            { user_id },
            { $set: setPayload },
            { upsert: true }
        );

        return NextResponse.json({ message: "Aptitude tracking updated successfully", result }, { status: 200 });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
