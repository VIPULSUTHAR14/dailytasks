import type { Metadata } from "next";
import Timetable from "@/components/Timetable";

export const metadata: Metadata = {
    title: "Timetable | AlgoCraft Workspace",
    description: "Daily task scheduler, sprint tracker, and execution matrix.",
};

export default function TimetablePage() {
    return <Timetable />;
}
