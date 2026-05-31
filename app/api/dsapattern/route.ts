import { dbcollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import z from "zod";
import fs from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "lib", "data", "dsaPatterns.json");

const dsaSchema = z.object({
    statuses: z.record(z.string(), z.boolean()),
});

type DsaPatternItem = {
    id: string;
    name: string;
    completed: boolean;
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

// Helper function to read static template patterns safely
async function getBasePatterns(): Promise<DsaPatternItem[]> {
    try {
        const fileContent = await fs.readFile(filePath, "utf-8");
        return JSON.parse(fileContent);
    } catch (e) {
        console.error("Critical: Failed to read local static patterns configuration file:", e);
        return [];
    }
}

export async function GET() {
    try {
        const user_id = await getAuthenticatedUserId();
        if (!user_id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Get the base definition structure of the 19 patterns
        const localPatterns = await getBasePatterns();

        // Fetch user-specific progress overrides from MongoDB
        const data = await dbcollection("dsapattern");
        const dsa = await data.findOne({ user_id });
        const dbStatuses = dsa?.statuses || {};

        // Merge user-specific state safely into memory
        const mergedPatterns = localPatterns.map(p => ({
            ...p,
            completed: dbStatuses[p.id] !== undefined ? dbStatuses[p.id] : false
        }));

        return NextResponse.json({
            statuses: dbStatuses,
            patterns: mergedPatterns
        }, { status: 200 });
    } catch (error: unknown) {
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
        const data = await dbcollection("dsapattern");

        // Build the isolated atomic update payload for MongoDB
        const setPayload: Record<string, any> = { updated_at: new Date() };
        for (const [key, val] of Object.entries(statuses)) {
            setPayload[`statuses.${key}`] = val;
        }

        // Update database state safely without touching the global filesystem
        await data.updateOne(
            { user_id },
            { $set: setPayload },
            { upsert: true }
        );

        // Fetch the fresh, updated array definition back to the UI seamlessly
        const localPatterns = await getBasePatterns();
        const updatedDsa = await data.findOne({ user_id });
        const latestStatuses = updatedDsa?.statuses || {};

        const mergedPatterns = localPatterns.map(p => ({
            ...p,
            completed: latestStatuses[p.id] !== undefined ? latestStatuses[p.id] : false
        }));

        return NextResponse.json({
            message: "DSA pattern tracking updated successfully",
            statuses: latestStatuses,
            patterns: mergedPatterns
        }, { status: 200 });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}