export default function TutorAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
        <p className="text-slate-600 mt-2">
          Track your course performance and student engagement.
        </p>
      </div>
      
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
          <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Analytics Coming Soon</h3>
        <p className="text-sm text-slate-600">
          Detailed analytics and insights will be available here.
        </p>
      </div>
    </div>
  );
}
