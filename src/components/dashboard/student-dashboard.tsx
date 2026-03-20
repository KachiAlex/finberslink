import Link from "next/link";
import { ArrowRight, Briefcase, MessageSquare } from "lucide-react";

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
        eyebrow="Student workspace"
        title="Stay on track and act on opportunities"
        description="Jump back into your active courses or follow up on applications without hunting through menus."
        accent="blue"
        actions={[
          { label: "Continue learning", href: "/courses", icon: ArrowRight },
          { label: "Review applications", href: "/applications", icon: Briefcase, variant: "secondary" },
        ]}
        metaSlot={
          <div className="flex items-center gap-2 text-slate-700">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span>Inbox</span>
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
