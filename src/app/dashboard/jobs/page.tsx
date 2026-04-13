import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireSession } from "@/lib/auth/session";
import { BrowseJobsTab } from "./_components/browse-jobs-tab";
// ApplicationsTab component not yet created
// ApplicationDraftsTab component not yet created

export const metadata = {
  title: "Finbers Link | Jobs & Applications",
  description: "Browse job opportunities and track your applications.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardJobsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    location?: string;
    jobType?: string;
    remoteOption?: string;
    company?: string;
    tags?: string;
    page?: string;
    featured?: string;
  }>;
}) {
  const session = await requireSession({
    allowedRoles: ["STUDENT"],
    failureMode: "error",
  });

  const params = await searchParams;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 to-slate-50 p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Career Center</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">Jobs & Applications</h1>
        <p className="mt-3 text-slate-600">Browse opportunities and track your applications in one place.</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="browse">Browse Jobs</TabsTrigger>
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <BrowseJobsTab
            filters={{
              search: params.search,
              location: params.location,
              jobType: params.jobType as any,
              remoteOption: params.remoteOption as any,
              company: params.company,
              tags: params.tags?.split(",").filter(Boolean),
              featured: params.featured === "true",
              page: params.page ? parseInt(params.page) : 1,
            }}
            userId={session.sub}
          />
        </TabsContent>

        <TabsContent value="applications">
          <div className="text-center py-8">
            <p className="text-slate-500">Applications tab component coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="drafts">
          <div className="text-center py-8">
            <p className="text-slate-500">Drafts tab component coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
