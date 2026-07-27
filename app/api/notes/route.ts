import { NextResponse } from "next/server";
import notesData from "@/lib/data/notes.json";

export async function GET() {
    return NextResponse.json(notesData);
}
