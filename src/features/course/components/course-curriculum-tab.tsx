"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LessonList } from "@/features/lms/components/lesson-list";
import { BookOpen, Clock, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";

interface CourseCurriculumTabProps {
  courseId: string;
  lessons: any[];
}

export function CourseCurriculumTab({ courseId, lessons }: CourseCurriculumTabProps) {
  const totalLessons = lessons?.length || 0;
  const completedLessons = lessons?.filter((lesson: any) => lesson.completed).length || 0;

  return (
    <div className="space-y-6">
      {/* Curriculum Header */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Course Curriculum</h2>
              <p className="text-gray-600 mt-1">
                {completedLessons} of {totalLessons} lessons completed
              </p>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-200">
              {Math.round((completedLessons / totalLessons) * 100) || 0}% Complete
            </Badge>
          </div>

          {/* Course Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{totalLessons}</div>
              <div className="text-sm text-gray-600">Lessons</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">32h</div>
              <div className="text-sm text-gray-600">Total Duration</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{completedLessons}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Lock className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{totalLessons - completedLessons}</div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lesson List */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Lessons</h3>
          {lessons && lessons.length > 0 ? (
            <LessonList courseId={courseId} lessons={lessons} />
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Lessons Available</h4>
              <p className="text-gray-600 mb-6">
                Course content is being prepared. Check back soon!
              </p>
              <Button variant="outline" className="border-gray-300 text-gray-700">
                <BookOpen className="w-4 h-4 mr-2" />
                Notify When Available
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Structure */}
      {lessons && lessons.length > 0 && (
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Course Structure</h3>
            <div className="space-y-4">
              {lessons.map((lesson: any, index: number) => (
                <div key={lesson.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      lesson.completed 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {lesson.completed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{lesson.title || `Lesson ${index + 1}`}</h4>
                      <p className="text-sm text-gray-600">{lesson.description || 'Lesson description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {lesson.duration || '45 min'}
                    </span>
                    {lesson.completed ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        Completed
                      </Badge>
                    ) : (
                      <Button size="sm" asChild>
                        <Link href={`/courses/${courseId}/lessons/${lesson.id}`}>
                          Start
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
