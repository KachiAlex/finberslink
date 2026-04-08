import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { CourseSummary } from "@/types/lms";

const levelCopy: Record<CourseSummary["level"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

interface CourseCardProps {
  course: CourseSummary;
  className?: string;
}

export function CourseCard({ course, className }: CourseCardProps) {
  return (
    <Card className={cn("overflow-hidden border border-slate-200/80 bg-white/95 shadow-sm", className)}>
      <div className="relative h-48 w-full">
        <Image
          src={course.coverImage}
          alt={course.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-900/90 to-transparent px-4 pb-4 pt-12 text-white">
          <div>
            <p className="text-sm text-white/90">{course.category}</p>
            <p className="text-lg font-semibold leading-tight">{course.title}</p>
          </div>
          <Badge variant="secondary" className="bg-white/90 text-slate-900">
            {levelCopy[course.level]}
          </Badge>
        </div>
      </div>
      <CardContent className="space-y-4 p-6">
        <p className="text-sm text-slate-600">{course.tagline}</p>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            {course.lessonsCompleted}/{course.lessonsCount} lessons
          </span>
          <span>{course.progressPercentage}%</span>
        </div>
        <Progress value={course.progressPercentage} className="h-2" />
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div>
            <p className="font-semibold text-slate-900">{course.instructor.name}</p>
            <p className="text-xs text-slate-500">{course.instructor.title}</p>
          </div>
          <Button asChild size="sm">
            <Link href={`/courses/${course.id}`}>View course</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
