import { Bell, Plus, Trash2, Edit2, Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Gradient Text Component
const GradientText = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
    {children}
  </span>
);

export default async function JobAlertsPage() {
  // TODO: Fetch user's job alerts once migration is complete
  const alerts: any[] = [];

  return (
    <div className="space-y-8">
      {/* Header with Gradient */}
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-emerald-500/10 rounded-2xl blur-2xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-white/50 backdrop-blur border border-cyan-200/50">
            <Bell className="h-4 w-4 text-cyan-600 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-700">Smart Notifications</span>
          </div>
          <h1 className="text-4xl font-bold">
            <GradientText>Job Alerts</GradientText>
          </h1>
          <p className="text-slate-600 mt-3 text-lg">
            Get notified when new jobs matching your criteria are posted
          </p>
        </div>
      </div>

      {/* Create Alert Button with Enhanced Styling */}
      <div>
        <Button asChild className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all px-6 py-2 h-11 rounded-lg font-medium">
          <Link href="/dashboard/job-alerts/create" className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Alert
          </Link>
        </Button>
      </div>

      {/* Alerts List or Empty State */}
      {alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert, idx) => (
            <div
              key={alert.id}
              className="opacity-0 animate-fadeIn"
              style={{
                animation: `fadeInUp 0.6s ease-out forwards`,
                animationDelay: `${idx * 100}ms`,
              }}
            >
              <style>{`
                @keyframes fadeInUp {
                  from {
                    opacity: 0;
                    transform: translateY(20px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
              <Card className="border border-slate-200 hover:shadow-xl transition-all duration-300 hover:border-cyan-300 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="w-5 h-5 text-blue-600" />
                        {alert.keywords.join(", ")}
                      </CardTitle>
                      <CardDescription>
                        {alert.location && `Location: ${alert.location} • `}
                        {alert.jobType && `Type: ${alert.jobType}`}
                      </CardDescription>
                    </div>
                    <Badge variant={alert.isActive ? "default" : "secondary"} className="transition-all group-hover:scale-110">
                      {alert.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="hover:border-blue-300 hover:text-blue-600 transition-colors">
                      <Link href={`/dashboard/job-alerts/${alert.id}/edit`} className="flex items-center gap-1">
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:border-red-300 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="group rounded-3xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 p-16 text-center transition-all duration-300 hover:border-cyan-400 hover:shadow-lg hover:from-blue-50 hover:to-cyan-50 cursor-pointer">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 transition-all duration-300 group-hover:scale-125 group-hover:shadow-lg">
            <Bell className="h-10 w-10 text-blue-600 transition-transform group-hover:rotate-12 group-hover:scale-110" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">No Job Alerts Yet</h3>
          <p className="text-slate-600 mb-8 text-lg">
            Create your first job alert to get notified about new opportunities that match your skills
          </p>
          <Button asChild className="gap-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 hover:from-blue-700 hover:via-cyan-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all px-8 py-2 h-11 rounded-lg font-medium">
            <Link href="/dashboard/job-alerts/create" className="flex items-center">
              Create Your First Alert <Plus className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      )}

      {/* How It Works Section (Placeholder) */}
      <Card className="border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            How Job Alerts Work
          </CardTitle>
          <CardDescription>
            Stay ahead of the competition with timely notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Set Criteria", desc: "Define keywords, location, and job type" },
              { title: "Receive Alerts", desc: "Get notified instantly when jobs match" },
              { title: "Apply Quick", desc: "One-click apply to opportunities" },
            ].map((step, i) => (
              <div key={i} className="rounded-xl p-4 bg-white/50 backdrop-blur border border-slate-200/50 hover:border-blue-300/50 transition-all">
                <p className="font-semibold text-slate-900 mb-1">{step.title}</p>
                <p className="text-sm text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
