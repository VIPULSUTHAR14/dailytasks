import { dbcollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { verifyCsrfOrigin, csrfForbiddenResponse } from "@/lib/security";
import z from "zod";

const sectionSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Section name is required"),
    type: z.string().default("notes"),
    content: z.string().default(""),
    items: z.array(z.string()).optional(),
}).passthrough();

const createCustomTopicSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, "Topic title is required"),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
    color: z.string().optional(),
    sections: z.array(sectionSchema).optional(),
    isFavorite: z.boolean().optional(),
    isPinned: z.boolean().optional(),
}).passthrough();

const updateCustomTopicSchema = z.object({
    id: z.string().min(1, "Topic ID is required"),
    title: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
    color: z.string().optional(),
    sections: z.array(sectionSchema).optional(),
    isFavorite: z.boolean().optional(),
    isPinned: z.boolean().optional(),
}).passthrough();

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
    isFavorite: true,
    isPinned: true,
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
            // First-time user: seed with starter topic
            const initialDoc = {
                user_id,
                topics: [DEFAULT_STARTER_TOPIC],
                created_at: new Date(),
                updated_at: new Date(),
            };
            await data.insertOne(initialDoc);
            return NextResponse.json([DEFAULT_STARTER_TOPIC], { status: 200 });
        }

        if (!record.topics || record.topics.length === 0) {
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
        if (!verifyCsrfOrigin(request)) {
            return csrfForbiddenResponse();
        }

        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const rawBody = await request.json();
        const body = createCustomTopicSchema.parse(rawBody);

        const newTopic = {
            id: body.id || `topic-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            title: body.title.trim(),
            category: body.category?.trim() || "General",
            tags: Array.isArray(body.tags) ? body.tags : [],
            description: body.description?.trim() || "",
            color: body.color || "sky",
            sections: Array.isArray(body.sections) && body.sections.length > 0 
                ? body.sections.map((s, idx) => ({
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any
            );
        }

        return NextResponse.json({ success: true, topic: newTopic }, { status: 201 });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0]?.message || "Invalid topic data" }, { status: 400 });
        }
        console.error("Custom Notes POST error:", error);
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
        const updatedTopic = updateCustomTopicSchema.parse(rawBody);

        const data = await dbcollection("custom_notes");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (updatedTopic as any).updated_at = new Date();

        const result = await data.updateOne(
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
                { upsert: true }
            );
        }

        return NextResponse.json({ success: true, message: "Topic updated successfully", topic: updatedTopic }, { status: 200 });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0]?.message || "Invalid topic data" }, { status: 400 });
        }
        console.error("Custom Notes PATCH error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        if (!verifyCsrfOrigin(request)) {
            return csrfForbiddenResponse();
        }

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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
        );

        return NextResponse.json({ success: true, message: "Topic deleted successfully" }, { status: 200 });
    } catch (error: unknown) {
        console.error("Custom Notes DELETE error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
