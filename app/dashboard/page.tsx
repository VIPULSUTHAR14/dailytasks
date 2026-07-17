"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/timetable");
    }, [router]);

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <span className="text-zinc-500 font-sans text-sm">Redirecting to Time Table...</span>
        </div>
    );
}
