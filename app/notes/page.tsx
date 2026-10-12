import type { Metadata } from "next";
import DsaNotes from "@/components/DsaNotes";

export const metadata: Metadata = {
    title: "DSA Notes | AlgoCraft Workspace",
    description: "DSA topic notes, code snippets, and algorithm walkthroughs.",
};

export default function NotesPage() {
    return <DsaNotes />;
}
