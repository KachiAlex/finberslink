"use client";

import React from "react";
import dynamic from "next/dynamic";

const AiResumeWizard = dynamic(() => import("../../../components/resume/ai-resume-wizard"), { ssr: false });

export default function GenerateAiPage() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Generate Resume with AI</h1>
      <p className="text-sm text-slate-600 mb-6">Interactive wizard will ask a few questions and generate a draft resume you can refine.</p>
      <AiResumeWizard />
      <AIResumeWizard />
    </main>
  );
}
