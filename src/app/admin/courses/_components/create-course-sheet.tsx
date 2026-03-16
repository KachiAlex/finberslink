"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

interface CreateCourseSheetProps {
  action: (formData: FormData) => Promise<void>;
  levels: readonly string[];
}

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Publishing..." : "Publish course"}
    </Button>
  );
};

export function CreateCourseSheet({ action, levels }: CreateCourseSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" className="min-w-[140px]">
          New course
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Launch a new course</SheetTitle>
        </SheetHeader>
        <form action={action} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Slug</label>
              <Input name="slug" placeholder="product-strategy" required autoComplete="off" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Level</label>
              <select
                name="level"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                defaultValue={levels[0] ?? "BEGINNER"}
              >
                {levels.map((option) => (
                  <option key={option} value={option}>
                    {option.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Title</label>
            <Input name="title" placeholder="Product Strategy Lab" required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Tagline</label>
            <Input name="tagline" placeholder="Design + execution" required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Category</label>
            <Input name="category" placeholder="Product" required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Cover image URL</label>
            <Input name="coverImage" placeholder="https://images.unsplash.com/..." required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Description</label>
            <Textarea name="description" placeholder="Course summary" rows={4} required />
          </div>
          <SubmitButton />
        </form>
      </SheetContent>
    </Sheet>
  );
}
