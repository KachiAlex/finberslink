"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Search, X } from "lucide-react";

interface Job {
  id: string;
  slug: string;
  title: string;
  company: string;
  location?: string | null;
  remoteOption?: string | null;
  description?: string;
}

interface JobBrowserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: Job[];
  onApply?: (job: Job) => void;
}

export function JobBrowserModal({
  open,
  onOpenChange,
  jobs,
  onApply,
}: JobBrowserModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(jobs[0] || null);

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Browse Jobs</DialogTitle>
          <p className="text-sm text-slate-600">Explore opportunities tailored to your profile</p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4">
          {/* Job List */}
          <div className="flex flex-col border-r border-slate-200 overflow-hidden">
            <div className="relative p-3 border-b border-slate-200 shrink-0">
              <Search className="absolute left-6 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search jobs..."
                className="pl-10 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="overflow-y-auto flex-1">
              {filteredJobs.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  <p>No jobs found matching your search</p>
                </div>
              ) : (
                <div className="space-y-2 p-3">
                  {filteredJobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedJob?.id === job.id
                          ? "border-blue-300 bg-blue-50 shadow-sm"
                          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <h4 className="font-semibold text-sm text-slate-900 line-clamp-1">
                        {job.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-1">{job.company}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {job.location || job.remoteOption || "Remote friendly"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Job Details */}
          <div className="flex flex-col overflow-hidden">
            {selectedJob ? (
              <div className="overflow-y-auto flex-1 p-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900">
                          {selectedJob.title}
                        </h3>
                        <p className="text-sm text-slate-600">{selectedJob.company}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {selectedJob.location ||
                          selectedJob.remoteOption ||
                          "Remote friendly"}
                      </span>
                    </div>
                  </div>

                  {selectedJob.description && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">
                        About this role
                      </h4>
                      <p className="text-sm text-slate-600 line-clamp-6">
                        {selectedJob.description}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-slate-200">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-lg"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        if (onApply) {
                          onApply(selectedJob);
                        }
                        onOpenChange(false);
                      }}
                    >
                      View & Apply
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                <p>Select a job to view details</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
