import { dbcollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import notesData from "@/lib/data/notes.json";

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
        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const updatedTopic = await request.json();
        if (!updatedTopic || typeof updatedTopic.id !== "number") {
            return NextResponse.json({ message: "Invalid topic data" }, { status: 400 });
        }

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
                }
            );
        }

        return NextResponse.json({ success: true, message: "Topic updated successfully" }, { status: 200 });
    } catch (error: unknown) {
        console.error("Notes PATCH error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
