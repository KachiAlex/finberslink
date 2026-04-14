import { NextRequest, NextResponse } from "next/server";

import { verifyAccessToken } from "@/lib/auth/jwt";
import {
  getDashboardInsights,
  getDashboardSummary,
  getStudentApplications,
  getStudentEnrollments,
  getStudentResumes,
  listRecommendedJobs,
  listSavedJobIds,
} from "@/features/dashboard/service";
import {
  getDashboardSectionsFullCache,
  setDashboardSectionsFullCache,
} from "@/features/dashboard/sections-cache";

async function measure<T>(name: string, fn: () => Promise<T>) {
  const start = Date.now();
  try {
    const data = await fn();
    const duration = Date.now() - start;
    console.log(`[dashboard/sections] ${name} completed in ${duration}ms`);
    return { data, error: null, durationMs: duration };
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[dashboard/sections] ${name} failed`, error);
    return {
      data: null,
      error: "Unable to load this section right now.",
      durationMs: duration,
    };
  }
}

async function withTimeout<T>(
  name: string,
  fn: () => Promise<T>,
  timeoutMs: number,
  fallback: T
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    const timeoutPromise = new Promise<T>((resolve) => {
      timeoutHandle = setTimeout(() => {
        console.warn(`[dashboard/sections] ${name} timed out after ${timeoutMs}ms`);
        resolve(fallback);
      }, timeoutMs);
    });

    return await Promise.race([fn(), timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await verifyAccessToken(accessToken);
    const mode = request.nextUrl.searchParams.get("mode") === "fast" ? "fast" : "full";

    const applicationsLimit = mode === "fast" ? { jobsLimit: 1, volunteerLimit: 1 } : { jobsLimit: 2, volunteerLimit: 1 };
    const recommendationsLimit = mode === "fast" ? 1 : 4;

    if (mode === "full") {
      const cachedPayload = getDashboardSectionsFullCache(user.sub);
      if (cachedPayload) {
        const cachedResponse = NextResponse.json({
          ...(cachedPayload as Record<string, unknown>),
          meta: {
            ...((cachedPayload as { meta?: Record<string, unknown> }).meta ?? {}),
            mode: "full",
            cached: true,
          },
        });
        cachedResponse.headers.set("X-Dashboard-Sections-Cache", "HIT");
        return cachedResponse;
      }
    }

    const [
      summaryResult,
      enrollmentsResult,
      resumesResult,
      applicationsResult,
      recommendedResult,
      savedIdsResult,
      insightsResult,
    ] = await Promise.all([
      measure("summary", () => getDashboardSummary(user.sub)),
      measure("enrollments", () => getStudentEnrollments(user.sub, 4)),
      measure("resumes", () => getStudentResumes(user.sub, 3)),
      measure("applications", () => getStudentApplications(user.sub, applicationsLimit)),
      measure("recommended", () =>
        mode === "fast"
          ? withTimeout("recommended", () => listRecommendedJobs(recommendationsLimit), 700, [])
          : listRecommendedJobs(recommendationsLimit)
      ),
      mode === "fast"
        ? Promise.resolve({ data: [], error: null, durationMs: 0 } as {
            data: string[];
            error: null;
            durationMs: number;
          })
        : measure("saved-ids", () =>
            withTimeout("saved-ids", () => listSavedJobIds(user.sub, 50), 600, [])
          ),
      measure("insights", () => getDashboardInsights(user.sub)),
    ]);

    const timings = {
      summaryMs: summaryResult.durationMs,
      enrollmentsMs: enrollmentsResult.durationMs,
      resumesMs: resumesResult.durationMs,
      applicationsMs: applicationsResult.durationMs,
      recommendedMs: recommendedResult.durationMs,
      savedIdsMs: savedIdsResult.durationMs,
      insightsMs: insightsResult.durationMs,
    };

    const payload = {
      data: {
        summary: summaryResult.data ?? null,
        enrollments: enrollmentsResult.data ?? [],
        resumes: resumesResult.data ?? [],
        applications: applicationsResult.data ?? { jobs: [], volunteer: [] },
        recommended: recommendedResult.data ?? [],
        savedIds: savedIdsResult.data ?? [],
        insights: insightsResult.data ?? { focus: [], skills: null },
      },
      errors: {
        summary: summaryResult.error,
        enrollments: enrollmentsResult.error,
        resumes: resumesResult.error,
        applications: applicationsResult.error,
        recommended: recommendedResult.error,
        insights: insightsResult.error,
      },
      meta: {
        mode,
        cached: false,
        generatedAt: new Date().toISOString(),
        timings,
      },
    };

    if (mode === "full") {
      setDashboardSectionsFullCache(user.sub, payload);
    }

    const response = NextResponse.json(payload);
    response.headers.set("X-Dashboard-Sections-Cache", mode === "full" ? "MISS" : "BYPASS");

    response.headers.set(
      "Server-Timing",
      [
        `summary;dur=${timings.summaryMs}`,
        `enrollments;dur=${timings.enrollmentsMs}`,
        `resumes;dur=${timings.resumesMs}`,
        `applications;dur=${timings.applicationsMs}`,
        `recommended;dur=${timings.recommendedMs}`,
        `savedIds;dur=${timings.savedIdsMs}`,
        `insights;dur=${timings.insightsMs}`,
      ].join(", "),
    );

    console.info(
      "[dashboard/sections] timing-summary",
      JSON.stringify({
        userId: user.sub,
        mode,
        timings,
      }),
    );

    return response;
  } catch (error) {
    console.error("Dashboard sections error", error);
    return NextResponse.json(
      { error: "Failed to load dashboard sections" },
      { status: 500 }
    );
  }
}
