"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, TrendingUp, Target, Users } from "lucide-react";

interface CourseOverviewTabProps {
  course: any;
}

export function CourseOverviewTab({ course }: CourseOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Course Description */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Course</h2>
          <p className="text-gray-700 leading-relaxed">
            {course.description || 'This comprehensive course provides in-depth knowledge and practical skills to help you master the subject matter.'}
          </p>
        </CardContent>
      </Card>

      {/* What You'll Learn */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">What You'll Learn</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {course.outcomes?.slice(0, 6).map((outcome: string, idx: number) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{outcome}</span>
              </div>
            )) || (
              <>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Master fundamental concepts and principles</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Apply theoretical knowledge to practical scenarios</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Develop industry-relevant skills and techniques</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Build a portfolio of real-world projects</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Skills */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Key Skills You'll Gain</h3>
          <div className="flex flex-wrap gap-2">
            {course.skills?.map((skill: string) => (
              <Badge key={skill} className="bg-blue-100 text-blue-700 border-blue-200">
                {skill}
              </Badge>
            )) || (
              <>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">Problem Solving</Badge>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">Critical Thinking</Badge>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">Communication</Badge>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">Technical Skills</Badge>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">Project Management</Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Target Audience */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Who This Course Is For</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Beginners</h4>
                <p className="text-gray-600 text-sm">No prior experience required - start from scratch</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Career Changers</h4>
                <p className="text-gray-600 text-sm">Transition into this field with comprehensive training</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Professionals</h4>
                <p className="text-gray-600 text-sm">Upgrade your skills and stay current with industry trends</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Requirements */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Prerequisites</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Basic computer literacy</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Internet access and a modern web browser</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Commitment to complete the course</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
