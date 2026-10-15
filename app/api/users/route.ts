import { getAuthenticatedUser, getAuthenticatedUserId } from "@/lib/auth/session";
import { dbcollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const UpdateProfileSchema = z.object({
    name: z.string().trim().min(1, "Name cannot be empty").max(60).optional(),
    avatarEmoji: z.string().trim().min(1).max(10).optional(),
    targetRole: z.string().trim().max(100).optional(),
    targetCompany: z.string().trim().max(100).optional(),
    dailyHours: z.number().min(0.5).max(18).optional(),
    preferredTheme: z.string().trim().max(50).optional(),
});

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            avatarEmoji: user.avatarEmoji || "🧑‍💻",
            targetRole: user.targetRole || "Software Developer",
            targetCompany: user.targetCompany || "Tier-1 Tech",
            dailyHours: user.dailyHours ?? 4,
            preferredTheme: user.preferredTheme || "current",
        });
    } catch (error) {
        console.error("Error in /api/users GET:", error);
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
        const parsed = UpdateProfileSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { message: parsed.error.issues[0]?.message || "Invalid payload" },
                { status: 400 }
            );
        }

        const updates: Record<string, unknown> = {};
        if (parsed.data.name !== undefined) updates.name = parsed.data.name;
        if (parsed.data.avatarEmoji !== undefined) updates.avatarEmoji = parsed.data.avatarEmoji;
        if (parsed.data.targetRole !== undefined) updates.targetRole = parsed.data.targetRole;
        if (parsed.data.targetCompany !== undefined) updates.targetCompany = parsed.data.targetCompany;
        if (parsed.data.dailyHours !== undefined) updates.dailyHours = parsed.data.dailyHours;
        if (parsed.data.preferredTheme !== undefined) updates.preferredTheme = parsed.data.preferredTheme;

        updates.updatedAt = new Date();

        const users = await dbcollection("users");
        let query: Record<string, unknown> = { _id: userId };
        if (ObjectId.isValid(userId)) {
            query = { _id: new ObjectId(userId) };
        }

        await users.updateOne(query, { $set: updates });

        const updatedUser = await getAuthenticatedUser();

        return NextResponse.json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error in /api/users PATCH:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}