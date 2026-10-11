"use client";

import React, { Suspense } from "react";
import DsaQuestions from "@/components/DsaQuestions";

export default function DsaQuestionsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0B0F17]" />}>
            <DsaQuestions />
        </Suspense>
    );
}
