import Link from "next/link";
import { ArrowRight, BookOpen, MessageSquare } from "lucide-react";

import { DashboardSectionsClient } from "@/app/dashboard/sections-client";
import { Badge } from "@/components/ui/badge";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";

interface StudentDashboardProps {
  userId: string;
}

export function StudentDashboard(_props: StudentDashboardProps) {
  return (
    <>
      <DashboardHero
        eyebrow="Finbers Link"
        title="Student mission control"
        description="Track your progress, polish your resume, and move quickly on new opportunities."
        accent="blue"
        actions={[
          { label: "Find jobs", href: "/jobs", icon: ArrowRight },
          { label: "Explore courses", href: "/courses", icon: BookOpen, variant: "secondary" },
        ]}
        metaSlot={
          <div className="flex items-center gap-2 text-slate-700">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span>Messages</span>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              0
            </Badge>
          </div>
        }
      />

      <DashboardSectionsClient />
    </>
  );
}
