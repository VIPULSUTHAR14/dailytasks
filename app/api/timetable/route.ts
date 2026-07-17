import { dbcollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import z from "zod";

const rowSchema = z.object({
    time: z.string(),
    duration: z.string(),
    task: z.string(),
    completed: z.boolean().default(false),
});

const timetableSchema = z.object({
    schedule: z.array(rowSchema),
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

// Helper to check if the timetable needs to be reset (if it hasn't been reset since the last 6:00 AM)
function shouldReset(lastResetAt?: Date | string): boolean {
    if (!lastResetAt) return true;

    const now = new Date();
    // Get today's 6:00 AM boundary in local timezone
    const today6AM = new Date(now);
    today6AM.setHours(6, 0, 0, 0);

    let boundary: Date;
    if (now >= today6AM) {
        // If current time is past today's 6 AM, the boundary is today's 6 AM
        boundary = today6AM;
    } else {
        // If current time is before today's 6 AM, the boundary is yesterday's 6 AM
        const yesterday6AM = new Date(today6AM);
        yesterday6AM.setDate(yesterday6AM.getDate() - 1);
        boundary = yesterday6AM;
    }

    return new Date(lastResetAt) < boundary;
}

export async function GET() {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const timetables = await dbcollection("timetable");
        let timetable = await timetables.findOne({ userId });

        if (!timetable) {
            return NextResponse.json({ message: "Timetable not found" }, { status: 404 });
        }

        // Check if automatic reset at 6:00 AM is needed
        if (shouldReset(timetable.lastResetAt)) {
            const updatedSchedule = timetable.schedule.map((item: any) => ({
                ...item,
                completed: false
            }));
            const now = new Date();

            await timetables.updateOne(
                { userId },
                {
                    $set: {
                        schedule: updatedSchedule,
                        lastResetAt: now,
                        updatedAt: now
                    }
                }
            );

            // Update in-memory object to return
            timetable.schedule = updatedSchedule;
            timetable.lastResetAt = now;
        }

        return NextResponse.json({ timetable });
    } catch (error) {
        console.error("GET timetable error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Fetch user email
        const usersCol = await dbcollection("users");
        let email = "";
        try {
            const user = await usersCol.findOne({ _id: new ObjectId(userId) });
            if (user) {
                email = user.email;
            }
        } catch (e) {
            console.error("Error fetching user details:", e);
        }

        const body = await request.json();
        const { schedule } = timetableSchema.parse(body);

        const timetables = await dbcollection("timetable");
        const existing = await timetables.findOne({ userId });

        const now = new Date();
        if (existing) {
            await timetables.updateOne(
                { userId },
                {
                    $set: {
                        schedule,
                        email,
                        updatedAt: now
                    }
                }
            );
            return NextResponse.json({ message: "Timetable updated successfully", schedule }, { status: 200 });
        } else {
            const newTimetable = {
                userId,
                email,
                schedule,
                lastResetAt: now, // Initialize reset time upon creation
                createdAt: now,
                updatedAt: now
            };
            const result = await timetables.insertOne(newTimetable);
            return NextResponse.json({ message: "Timetable created successfully", result, schedule }, { status: 201 });
        }
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
        }
        console.error("POST timetable error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const timetables = await dbcollection("timetable");
        const doc = await timetables.findOne({ userId });

        if (!doc) {
            return NextResponse.json({ message: "Timetable not found" }, { status: 404 });
        }

        const now = new Date();

        // 1. Reset checkmarks action (Manually requested by user)
        if (body.action === "reset") {
            const updatedSchedule = doc.schedule.map((item: any) => ({
                ...item,
                completed: false
            }));
            await timetables.updateOne(
                { userId },
                {
                    $set: {
                        schedule: updatedSchedule,
                        lastResetAt: now, // Also update lastResetAt to prevent duplicate auto-reset
                        updatedAt: now
                    }
                }
            );
            return NextResponse.json({ message: "Checkmarks reset successfully", schedule: updatedSchedule }, { status: 200 });
        }

        // 2. Single item checkbox toggle
        if (typeof body.index === "number" && typeof body.completed === "boolean") {
            const index = body.index;
            if (index < 0 || index >= doc.schedule.length) {
                return NextResponse.json({ message: "Invalid row index" }, { status: 400 });
            }
            const updatedSchedule = [...doc.schedule];
            updatedSchedule[index].completed = body.completed;

            await timetables.updateOne(
                { userId },
                { $set: { schedule: updatedSchedule, updatedAt: now } }
            );
            return NextResponse.json({ message: "Task completion updated", schedule: updatedSchedule }, { status: 200 });
        }

        // 3. Full schedule update (Edit mode save)
        if (body.schedule) {
            const { schedule } = timetableSchema.parse(body);
            await timetables.updateOne(
                { userId },
                { $set: { schedule, updatedAt: now } }
            );
            return NextResponse.json({ message: "Timetable updated successfully", schedule }, { status: 200 });
        }

        return NextResponse.json({ message: "Invalid PATCH payload" }, { status: 400 });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
        }
        console.error("PATCH timetable error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
