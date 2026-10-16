import { dbcollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { verifyCsrfOrigin, csrfForbiddenResponse } from "@/lib/security";

// GET: Fetch habit tracker state for the authenticated user
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized", isGuest: true }, { status: 401 });
    }

    const collection = await dbcollection("habit_tracker");
    const doc = await collection.findOne({ userId });

    if (!doc || !doc.data) {
      return NextResponse.json({ tracker: null, isGuest: false });
    }

    return NextResponse.json({ tracker: doc.data, isGuest: false });
  } catch (error) {
    console.error("GET /api/habit-tracker error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Save / update habit tracker state for the authenticated user
export async function PUT(request: NextRequest) {
  try {
    if (!verifyCsrfOrigin(request)) {
      return csrfForbiddenResponse();
    }

    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized", isGuest: true }, { status: 401 });
    }

    const body = await request.json();
    const { tracker } = body;

    if (!tracker || typeof tracker !== "object") {
      return NextResponse.json({ message: "Invalid tracker payload" }, { status: 400 });
    }

    const collection = await dbcollection("habit_tracker");
    await collection.updateOne(
      { userId },
      {
        $set: {
          data: tracker,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ message: "Synced successfully" });
  } catch (error) {
    console.error("PUT /api/habit-tracker error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
