import { dbcollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { verifyCsrfOrigin, csrfForbiddenResponse } from "@/lib/security";
import notesData from "@/lib/data/notes.json";
import z from "zod";

const noteTopicSchema = z.object({
    id: z.number(),
    name: z.string().optional(),
    level: z.string().optional(),
    notes: z.string().optional(),
    revisionNotes: z.string().optional(),
    completed: z.boolean().optional(),
    favorite: z.boolean().optional(),
    confidence: z.number().optional(),
}).passthrough();

export async function GET() {
    try {
        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const data = await dbcollection("dsatopics");
        const record = await data.findOne({ user_id });

        if (!record) {
            // First time user - initialize the document with default notesData
            const initialDoc = {
                user_id,
                topics: notesData,
                created_at: new Date(),
                updated_at: new Date(),
            };
            await data.insertOne(initialDoc);
            return NextResponse.json(notesData, { status: 200 });
        }

        if (!record.topics) {
            // Document exists but has no topics array - initialize it
            await data.updateOne(
                { user_id },
                {
                    $set: {
                        topics: notesData,
                        updated_at: new Date(),
                    }
                }
            );
            return NextResponse.json(notesData, { status: 200 });
        }

        return NextResponse.json(record.topics, { status: 200 });
    } catch (error: unknown) {
        console.error("Notes GET error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        if (!verifyCsrfOrigin(request)) {
            return csrfForbiddenResponse();
        }

        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const rawBody = await request.json();
        const updatedTopic = noteTopicSchema.parse(rawBody);

        const data = await dbcollection("dsatopics");

        // Ensure user document exists and has topics array initialized
        const record = await data.findOne({ user_id });
        if (!record) {
            await data.insertOne({
                user_id,
                topics: notesData,
                created_at: new Date(),
                updated_at: new Date(),
            });
        } else if (!record.topics) {
            await data.updateOne(
                { user_id },
                {
                    $set: {
                        topics: notesData,
                        updated_at: new Date(),
                    }
                }
            );
        }

        // Update the topic inside the user's topics array
        let result = await data.updateOne(
            { user_id, "topics.id": updatedTopic.id },
            {
                $set: {
                    "topics.$": updatedTopic,
                    updated_at: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            // Document and topics array exist, but this specific topic ID is missing.
            // Append it to the topics array.
            result = await data.updateOne(
                { user_id },
                {
                    $push: { topics: updatedTopic },
                    $set: { updated_at: new Date() }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any
            );
        }

        return NextResponse.json({ success: true, message: "Topic updated successfully" }, { status: 200 });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0]?.message || "Invalid input data" }, { status: 400 });
        }
        console.error("Notes PATCH error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
