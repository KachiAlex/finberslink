import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getExportHistory } from "@/features/resume/export-service";
import { requireAuth } from "@/lib/auth/guards";

export const runtime = "nodejs";

const QuerySchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  template: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

/**
 * GET /api/resumes/[resumeId]/export-history
 * Get export history for a resume with filtering
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resumeId: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { resumeId } = await params;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryData = {
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      template: searchParams.get("template") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50,
    };

    const validated = QuerySchema.parse(queryData);

    const filters = {
      dateFrom: validated.dateFrom ? new Date(validated.dateFrom) : undefined,
      dateTo: validated.dateTo ? new Date(validated.dateTo) : undefined,
      template: validated.template,
      limit: validated.limit,
    };

    const result = await getExportHistory(resumeId, filters);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
    }
    console.error("Error fetching export history:", error);
    return NextResponse.json({ error: "Failed to fetch export history" }, { status: 500 });
  }
}
