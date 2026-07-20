import { dbcollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import z from "zod";
import baseQuestions from "@/lib/data/dsaQuesions.json";

const dsaSchema = z.object({
    statuses: z.record(z.string(), z.boolean()),
});

type DsaQuestion = {
    name: string;
    difficulty: string;
    url: string;
};

type DsaTopic = {
    id: string;
    name: string;
    questions: DsaQuestion[];
};

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

// Generate a stable unique key for each question (topic-id + slugified question name)
function questionKey(topicId: string, questionName: string): string {
    return `${topicId}::${questionName}`;
}

export async function GET() {
    try {
        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const topics = baseQuestions as DsaTopic[];

        // Fetch user-specific progress overrides from MongoDB
        const data = await dbcollection("dsaquestions");
        const record = await data.findOne({ user_id });
        const dbStatuses = record?.statuses || {};

        // Merge user-specific completion state into the topics structure
        const mergedTopics = topics.map(topic => ({
            ...topic,
            questions: topic.questions.map(q => ({
                ...q,
                completed: dbStatuses[questionKey(topic.id, q.name)] === true,
            })),
        }));

        return NextResponse.json({
            statuses: dbStatuses,
            topics: mergedTopics,
        }, { status: 200 });
    } catch (error: unknown) {
        console.error("DSA Questions GET error:", error);
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
        const { statuses } = dsaSchema.parse(body);
        const data = await dbcollection("dsaquestions");

        // Build the isolated atomic update payload for MongoDB
        const setPayload: Record<string, any> = { updated_at: new Date() };
        for (const [key, val] of Object.entries(statuses)) {
            setPayload[`statuses.${key}`] = val;
        }

        // Update database state
        await data.updateOne(
            { user_id },
            { $set: setPayload },
            { upsert: true }
        );

        // The client ignores the response payload on success, so we return a simple success status
        // to save CPU cycles, disk IO, database queries, and bandwidth.
        return NextResponse.json({
            success: true,
            message: "DSA question tracking updated successfully"
        }, { status: 200 });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
        }
        console.error("DSA Questions PATCH error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
