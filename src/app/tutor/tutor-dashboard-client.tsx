"use client";

import { Button } from "../../components/ui/button";
import { BarChart3, BookOpen, PenSquare, Users, Plus } from "lucide-react";
import Link from "next/link";
import { useCreateCourseModal } from "../../components/course/create-course-modal";

interface TutorDashboardClientProps {
  coursesCount: number;
  enrollmentsCount: number;
  lessonsCount: number;
}

export function TutorDashboardClient({ coursesCount, enrollmentsCount, lessonsCount }: TutorDashboardClientProps) {
  const { openModal, closeModal, CreateCourseModal } = useCreateCourseModal("tutor");

  const StatCard = ({
    title,
    value,
    icon: Icon,
  }: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center">
      <div className="mb-3 rounded-full bg-blue-50 p-2 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs font-medium text-slate-600">{title}</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-white">
      <CreateCourseModal />
      
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-3">
          <StatCard title="Courses" value={coursesCount} icon={BookOpen} />
          <StatCard title="Students" value={enrollmentsCount} icon={Users} />
          <StatCard title="Lessons" value={lessonsCount} icon={BarChart3} />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-600">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button size="lg" className="h-12" onClick={openModal}>
              <Plus className="mr-2 h-5 w-5" />
              Create Course
            </Button>
            <Button asChild size="lg" className="h-12">
              <Link href="/tutor/courses">
                <BookOpen className="mr-2 h-5 w-5" />
                Manage Courses
              </Link>
            </Button>
            <Button asChild size="lg" className="h-12">
              <Link href="/tutor/exams/new">
                <PenSquare className="mr-2 h-5 w-5" />
                Create Exam
              </Link>
            </Button>
            <Button asChild size="lg" className="h-12">
              <Link href="/tutor/exams">
                <BarChart3 className="mr-2 h-5 w-5" />
                Manage Exams
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
