import { dbcollection } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
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


export async function GET() {
    try {
        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const data = await dbcollection("tasks");

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const tasks = await data.find({
            user_id,
            created_at: { $gte: startOfDay, $lte: endOfDay }
        }).toArray();

        const filterddata = tasks.filter(t => t.task.status === "completed");

        return NextResponse.json({ tasks, filterddata })
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}