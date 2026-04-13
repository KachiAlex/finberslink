import Image from "next/image";
import Link from "next/link";
import { ChevronRight, GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { CourseDetail } from "@/types/lms";

const levelCopy: Record<CourseDetail["level"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

interface CourseHeroProps {
  course: CourseDetail;
  className?: string;
}

export function CourseHero({ course, className }: CourseHeroProps) {
  return (
    <Card className={cn("relative overflow-hidden border border-white/70 bg-white", className)}>
      <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="relative p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-amber-50" />
          <div className="relative space-y-5">
            <Badge variant="outline" className="border-primary/40 text-primary">
              {course.category} · {levelCopy[course.level]}
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              {course.title}
            </h1>
            <p className="text-lg text-slate-600">{course.tagline}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Instructor</p>
                <p className="font-semibold text-slate-900">{course.instructor.name}</p>
                <p className="text-xs text-slate-500">{course.instructor.title}</p>
              </div>
              <div className="h-12 w-px bg-slate-200" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Lessons</p>
                <p className="font-semibold text-slate-900">
                  {course.lessonsCompleted}/{course.lessonsCount}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Progress</p>
                <p className="font-semibold text-slate-900">{course.progressPercentage}%</p>
              </div>
            </div>
            <div>
              <Progress value={course.progressPercentage} className="h-2" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href={`/courses/${course.id}/lessons/${course.nextLessonId ?? course.lessons[0]?.id ?? ""}`}>
                  Continue learning
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {course.certificateAvailable && (
                <Button size="lg" variant="outline" className="gap-2 text-primary">
                  <GraduationCap className="h-4 w-4" /> Certificate track
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="relative min-h-[320px]">
          <Image
            src={course.coverImage}
            alt={course.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 40vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
        </div>
      </div>
    </Card>
  );
}
