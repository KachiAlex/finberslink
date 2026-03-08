import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth/jwt";
import {
  getStudentApplications,
  getStudentEnrollments,
  getStudentResumes,
  listRecommendedJobs,
  listSavedJobIds,
} from "@/features/dashboard/service";

async function measure<T>(name: string, fn: () => Promise<T>) {
  const start = Date.now();
  try {
    const data = await fn();
    const duration = Date.now() - start;
    console.log(`[dashboard/sections] ${name} completed in ${duration}ms`);
    return { data, error: null };
  } catch (error) {
    console.error(`[dashboard/sections] ${name} failed`, error);
    return { data: null, error: "Unable to load this section right now." };
  }
}

type SectionResults<T> = Awaited<ReturnType<typeof measure<T>>>;

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);

    const [enrollmentsResult, resumesResult, applicationsResult, recommendedResult, savedIdsResult] =
      await Promise.all([
        measure("enrollments", () => getStudentEnrollments(user.sub, 4)),
        measure("resumes", () => getStudentResumes(user.sub, 3)),
        measure("applications", () =>
          getStudentApplications(user.sub, { jobsLimit: 2, volunteerLimit: 1 })
        ),
        measure("recommended", () => listRecommendedJobs(4)),
        measure("saved-ids", () => listSavedJobIds(user.sub, 50)),
      ]);

    return NextResponse.json({
      data: {
        enrollments: enrollmentsResult.data ?? [],
        resumes: resumesResult.data ?? [],
        applications: applicationsResult.data ?? { jobs: [], volunteer: [] },
        recommended: recommendedResult.data ?? [],
        savedIds: savedIdsResult.data ?? [],
      },
      errors: {
        enrollments: enrollmentsResult.error,
        resumes: resumesResult.error,
        applications: applicationsResult.error,
        recommended: recommendedResult.error,
      },
    });
  } catch (error) {
    console.error("Dashboard sections error", error);
    return NextResponse.json(
      { error: "Failed to load dashboard sections" },
      { status: 500 }
    );
  }
}
