import { dbcollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import z from "zod";

const taskSchema = z.object({
    // user_id is now handled securely on the server via cookies
    created_at: z.coerce.date().optional(),
    task: z.object({
        title: z.string(),
        status: z.enum(["pending", "completed"]),
        updated_at: z.coerce.date().optional(),
    })
})

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

        const data = await dbcollection("tasks");
        const tasks = await data.find({ user_id }).toArray();
        if (tasks.length === 0) {
            return NextResponse.json({ message: "No tasks found" }, { status: 404 })
        }
        return NextResponse.json({ tasks })
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}


export async function POST(request: NextRequest) {
    try {
        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { task } = taskSchema.parse(body);
        const data = await dbcollection("tasks");

        const newTask = {
            user_id,
            created_at: new Date(),
            task: {
                ...task,
                updated_at: new Date()
            }
        };

        const result = await data.insertOne(newTask);
        return NextResponse.json({ message: "Task created successfully", result, task: newTask }, { status: 201 })
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}


export async function PATCH(request: NextRequest) {
    try {
        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { task } = taskSchema.parse(body);
        const data = await dbcollection("tasks");

        const result = await data.updateOne(
            { user_id, "task.title": task.title },
            { $set: { task: { ...task, updated_at: new Date() } } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ message: "Task not found to update" }, { status: 404 });
        }

        return NextResponse.json({ message: "Task updated successfully", result })
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}


export async function DELETE(request: NextRequest) {
    try {
        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const title = request.nextUrl.searchParams.get("title");

        if (!title) {
            return NextResponse.json({ message: "Title parameter is required" }, { status: 400 });
        }

        const data = await dbcollection("tasks");
        const result = await data.deleteOne({ user_id, "task.title": title });

        if (result.deletedCount === 0) {
            return NextResponse.json({ message: "Task not found to delete" }, { status: 404 });
        }

        return NextResponse.json({ message: "Task deleted successfully", result })
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}