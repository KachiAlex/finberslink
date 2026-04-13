"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

interface CreateJobSheetProps {
  action: (formData: FormData) => Promise<void>;
  jobTypes: readonly string[];
  remoteOptions: readonly string[];
}

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Posting..." : "Post job"}
    </Button>
  );
};

export function CreateJobSheet({ action, jobTypes, remoteOptions }: CreateJobSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" className="min-w-[140px]">
          New job
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Publish a new role</SheetTitle>
        </SheetHeader>
        <form action={action} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Job title</label>
            <Input name="title" placeholder="Product Manager" required autoComplete="off" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Company</label>
            <Input name="company" placeholder="Acme Corp" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Location</label>
              <Input name="location" placeholder="San Francisco, CA" required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Country</label>
              <Input name="country" placeholder="USA" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Job type</label>
              <select
                name="jobType"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                defaultValue={jobTypes[0] ?? "FULL_TIME"}
              >
                {jobTypes.map((option) => (
                  <option key={option} value={option}>
                    {option.toLowerCase().replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Remote option</label>
              <select
                name="remoteOption"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                defaultValue={remoteOptions[0] ?? "REMOTE"}
              >
                {remoteOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Description</label>
            <Textarea name="description" placeholder="Summary, requirements, perks..." rows={4} />
          </div>
          <SubmitButton />
        </form>
      </SheetContent>
    </Sheet>
  );
}
