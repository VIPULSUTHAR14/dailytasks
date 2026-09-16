import { dbcollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

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

const DEFAULT_STARTER_TOPIC = {
    id: "starter-custom-note-1",
    title: "Welcome to Custom Notes",
    category: "General",
    tags: ["guide", "markdown", "getting-started"],
    description: "Create topics with dynamic sections, rich markdown, sticky toolbox, highlights, and links.",
    color: "sky",
    sections: [
        {
            id: "sec-overview",
            name: "Overview & Features",
            type: "notes",
            content: `# Welcome to Your Custom Notes 🚀

Here you can create notes for any topic you want with **completely customizable sections**!

### Key Features:
- ✍️ **Custom Sections**: Define your own section names during or after creation.
- 🎨 **Sticky Toolbox**: Left-side formatting palette that travels with your scroll.
- 🌈 **Colored Highlights**: Highlight text with ==r:Red==, ==g:Green==, ==b:Blue==, ==y:Yellow==, ==p:Purple== marks.
- 🔗 **Resource & Video Links**: Clickable [🎥 Video Explanations](https://youtube.com) and [🔗 Documentation](https://developer.mozilla.org).
- 📐 **Math & Code**: Support for \`inline code\`, code blocks, superscript ^x^, subscript ~2~, and ~~strikethrough~~.
`,
        },
        {
            id: "sec-quick-guide",
            name: "How to Add Sections",
            type: "notes",
            content: `### Adding & Managing Sections

1. Click **+ New Topic** on the dashboard to create a topic with your chosen sections.
2. Inside any note topic, click **+ Add Section** on the sidebar to dynamically add more sections anytime.
3. Use the **Edit** button on top of any section to switch to markdown editing mode.
4. Click **Preview** to see your formatted notes with clickable links and syntax highlights.
`,
        }
    ],
    isFavorite: false,
    isPinned: false,
    created_at: new Date(),
    updated_at: new Date(),
};

export async function GET() {
    try {
        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const data = await dbcollection("custom_notes");
        const record = await data.findOne({ user_id });

        if (!record) {
            // First time user - initialize the document with starter topic
            const initialDoc = {
                user_id,
                topics: [DEFAULT_STARTER_TOPIC],
                created_at: new Date(),
                updated_at: new Date(),
            };
            await data.insertOne(initialDoc);
            return NextResponse.json([DEFAULT_STARTER_TOPIC], { status: 200 });
        }

        if (!record.topics) {
            await data.updateOne(
                { user_id },
                {
                    $set: {
                        topics: [DEFAULT_STARTER_TOPIC],
                        updated_at: new Date(),
                    }
                }
            );
            return NextResponse.json([DEFAULT_STARTER_TOPIC], { status: 200 });
        }

        return NextResponse.json(record.topics, { status: 200 });
    } catch (error: unknown) {
        console.error("Custom Notes GET error:", error);
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
        if (!body || !body.title) {
            return NextResponse.json({ message: "Topic title is required" }, { status: 400 });
        }

        const newTopic = {
            id: body.id || `topic-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            title: body.title.trim(),
            category: body.category?.trim() || "General",
            tags: Array.isArray(body.tags) ? body.tags : [],
            description: body.description?.trim() || "",
            color: body.color || "sky",
            sections: Array.isArray(body.sections) && body.sections.length > 0 
                ? body.sections.map((s: any, idx: number) => ({
                    id: s.id || `sec-${Date.now()}-${idx}`,
                    name: s.name?.trim() || `Section ${idx + 1}`,
                    type: s.type || "notes",
                    content: s.content || "",
                    items: Array.isArray(s.items) ? s.items : []
                }))
                : [
                    {
                        id: `sec-${Date.now()}-1`,
                        name: "Main Notes",
                        type: "notes",
                        content: `# ${body.title.trim()}\n\nWrite your notes here...`,
                    }
                ],
            isFavorite: Boolean(body.isFavorite),
            isPinned: Boolean(body.isPinned),
            created_at: new Date(),
            updated_at: new Date(),
        };

        const data = await dbcollection("custom_notes");
        const record = await data.findOne({ user_id });

        if (!record) {
            await data.insertOne({
                user_id,
                topics: [newTopic],
                created_at: new Date(),
                updated_at: new Date(),
            });
        } else {
            await data.updateOne(
                { user_id },
                {
                    $push: { topics: newTopic },
                    $set: { updated_at: new Date() }
                } as any
            );
        }

        return NextResponse.json({ success: true, topic: newTopic }, { status: 201 });
    } catch (error: unknown) {
        console.error("Custom Notes POST error:", error);
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
        if (!updatedTopic || !updatedTopic.id) {
            return NextResponse.json({ message: "Invalid topic data" }, { status: 400 });
        }

        const data = await dbcollection("custom_notes");
        updatedTopic.updated_at = new Date();

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
            // Append if not found
            await data.updateOne(
                { user_id },
                {
                    $push: { topics: updatedTopic },
                    $set: { updated_at: new Date() }
                } as any,
                { upsert: true }
            );
        }

        return NextResponse.json({ success: true, message: "Topic updated successfully", topic: updatedTopic }, { status: 200 });
    } catch (error: unknown) {
        console.error("Custom Notes PATCH error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const topicId = searchParams.get("id");

        if (!topicId) {
            return NextResponse.json({ message: "Topic ID is required" }, { status: 400 });
        }

        const data = await dbcollection("custom_notes");
        await data.updateOne(
            { user_id },
            {
                $pull: { topics: { id: topicId } },
                $set: { updated_at: new Date() }
            } as any
        );

        return NextResponse.json({ success: true, message: "Topic deleted successfully" }, { status: 200 });
    } catch (error: unknown) {
        console.error("Custom Notes DELETE error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
