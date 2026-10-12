import React, { Suspense } from "react";
import type { Metadata } from "next";
import DsaQuestions from "@/components/DsaQuestions";

export const metadata: Metadata = {
    title: "DSA Question Matrix | AlgoCraft Workspace",
    description: "Curated LeetCode and Striver DSA question matrix with tracking.",
};

export default function DsaQuestionsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0B0F17]" />}>
            <DsaQuestions />
        </Suspense>
    );
}
