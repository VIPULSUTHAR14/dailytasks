import type { Metadata } from "next";
import CustomNotes from "@/components/CustomNotes";

export const metadata: Metadata = {
    title: "Custom Notes | AlgoCraft Workspace",
    description: "Rich markdown and technical notes editor with tag organization.",
};

export default function CustomNotesPage() {
    return <CustomNotes />;
}
