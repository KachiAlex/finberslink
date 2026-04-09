"use client";

import Link from "next/link";
import { Edit2, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumeCardProps {
  resume: {
    id: string;
    title: string;
    updatedAt: string;
  };
}

export function ResumeCard({ resume }: ResumeCardProps) {
  return (
    <div className="group relative rounded-lg border border-slate-200 bg-white overflow-hidden hover:shadow-lg transition-all">
      <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Edit2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">{resume.title || "Untitled Resume"}</p>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-slate-900 line-clamp-1">
          {resume.title || "Untitled Resume"}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Updated {new Date(resume.updatedAt).toLocaleDateString()}
        </p>

        <div className="flex gap-2 mt-4">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={`/resume/${resume.id}`}>
              <Eye className="h-3 w-3 mr-1" />
              View
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={`/resume/${resume.id}/edit`}>
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
