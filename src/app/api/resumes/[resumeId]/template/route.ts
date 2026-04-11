import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { updateResume } from "@/features/resume/service";
import { invalidateDashboardInsights } from "@/features/dashboard/service";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest, { params }: { params: { resumeId: string } }) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    const { template } = await request.json();

    if (!template || typeof template !== "string") {
      return NextResponse.json({ error: "Invalid template" }, { status: 400 });
    }

    // Update the resume template
    await updateResume(params.resumeId, { template });

    // Invalidate dashboard cache
    await invalidateDashboardInsights(user.sub);

    // Revalidate paths
    revalidatePath(`/resume/${params.resumeId}/edit`);
    revalidatePath(`/resume/${params.resumeId}`);

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error("Failed to update template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}
