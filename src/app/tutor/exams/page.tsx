export default function TutorExamsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Exams</h1>
        <p className="text-slate-600 mt-2">
          Create and manage exams for your courses.
        </p>
      </div>
      
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
          <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Exams Coming Soon</h3>
        <p className="text-sm text-slate-600">
          Exam creation and management features will be available here.
        </p>
      </div>
    </div>
  );
}
