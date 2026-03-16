import { dbcollection } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const users = (await dbcollection("user")).find({});
        const data = await users.toArray();
        if (data.length == 0) {
            return NextResponse.json({ message: "No users found" }, { status: 404 });
        }
        return NextResponse.json(data);
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}