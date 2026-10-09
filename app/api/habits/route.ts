import { dbcollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import z from "zod";

const createHabitSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    priority: z.enum(["High", "Medium", "Low"]).default("High"),
    completedDates: z.array(z.string()).default([]),
});

const patchHabitSchema = z.object({
    id: z.string().min(1, "Habit ID is required"),
    title: z.string().optional(),
    priority: z.enum(["High", "Medium", "Low"]).optional(),
    dateStr: z.string().optional(), // For atomic single-date toggle
    completedDates: z.array(z.string()).optional(), // For direct array update
});

// Helper to extract authenticated user from session cookie
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

// Build query to find habit by MongoDB _id or custom string id
function buildHabitQuery(id: string, user_id: string) {
    if (ObjectId.isValid(id)) {
        return {
            user_id,
            $or: [{ _id: new ObjectId(id) }, { id }, { title: id }],
        };
    }
    return {
        user_id,
        $or: [{ id }, { title: id }],
    };
}

// GET: Fetch all habits for authenticated user
export async function GET() {
    try {
        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized", isGuest: true }, { status: 401 });
        }

        const collection = await dbcollection("habits");
        const docs = await collection.find({ user_id }).sort({ createdAt: -1 }).toArray();

        const habits = docs.map((doc) => ({
            id: doc._id ? doc._id.toString() : doc.id,
            title: doc.title,
            priority: doc.priority || "High",
            completedDates: Array.isArray(doc.completedDates) ? doc.completedDates : [],
            createdAt: doc.createdAt || new Date().toISOString(),
        }));

        return NextResponse.json({ habits });
    } catch (error: unknown) {
        console.error("GET /api/habits error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Create a new habit in the database
export async function POST(request: NextRequest) {
    try {
        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized", isGuest: true }, { status: 401 });
        }

        const body = await request.json();
        const parsed = createHabitSchema.parse(body);
        const collection = await dbcollection("habits");

        const newHabitDoc = {
            user_id,
            ...(parsed.id ? { id: parsed.id } : {}),
            title: parsed.title.trim(),
            priority: parsed.priority,
            completedDates: parsed.completedDates || [],
            createdAt: new Date().toISOString(),
        };

        const result = await collection.insertOne(newHabitDoc);

        return NextResponse.json(
            {
                message: "Habit created successfully",
                habit: {
                    id: result.insertedId.toString(),
                    ...newHabitDoc,
                },
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0]?.message || "Validation Error" }, { status: 400 });
        }
        console.error("POST /api/habits error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH: Toggle date or update habit attributes
export async function PATCH(request: NextRequest) {
    try {
        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized", isGuest: true }, { status: 401 });
        }

        const body = await request.json();
        const parsed = patchHabitSchema.parse(body);
        const collection = await dbcollection("habits");

        const query = buildHabitQuery(parsed.id, user_id);
        const existing = await collection.findOne(query);

        if (!existing) {
            return NextResponse.json({ message: "Habit not found" }, { status: 404 });
        }

        let updatedDates = existing.completedDates || [];

        // If toggling a single date
        if (parsed.dateStr) {
            if (updatedDates.includes(parsed.dateStr)) {
                updatedDates = updatedDates.filter((d: string) => d !== parsed.dateStr);
            } else {
                updatedDates = [...updatedDates, parsed.dateStr];
            }
        } else if (Array.isArray(parsed.completedDates)) {
            updatedDates = parsed.completedDates;
        }

        const updateFields: Record<string, unknown> = {
            completedDates: updatedDates,
            updatedAt: new Date().toISOString(),
        };

        if (parsed.title) updateFields.title = parsed.title.trim();
        if (parsed.priority) updateFields.priority = parsed.priority;

        await collection.updateOne(query, { $set: updateFields });

        return NextResponse.json({
            message: "Habit updated successfully",
            habit: {
                id: existing._id ? existing._id.toString() : existing.id,
                title: parsed.title ? parsed.title.trim() : existing.title,
                priority: parsed.priority || existing.priority,
                completedDates: updatedDates,
                createdAt: existing.createdAt,
            },
        });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0]?.message || "Validation Error" }, { status: 400 });
        }
        console.error("PATCH /api/habits error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Delete a habit by id
export async function DELETE(request: NextRequest) {
    try {
        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized", isGuest: true }, { status: 401 });
        }

        const id = request.nextUrl.searchParams.get("id");
        if (!id) {
            return NextResponse.json({ message: "Habit ID parameter is required" }, { status: 400 });
        }

        const collection = await dbcollection("habits");
        const query = buildHabitQuery(id, user_id);
        const result = await collection.deleteOne(query);

        if (result.deletedCount === 0) {
            return NextResponse.json({ message: "Habit not found to delete" }, { status: 404 });
        }

        return NextResponse.json({ message: "Habit deleted successfully", id });
    } catch (error: unknown) {
        console.error("DELETE /api/habits error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
