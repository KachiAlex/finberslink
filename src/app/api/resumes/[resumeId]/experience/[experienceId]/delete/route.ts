import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";
import { invalidateDashboardInsights } from "@/features/dashboard/service";
import { revalidatePath } from "next/cache";

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { resumeId: string; experienceId: string } }
) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    const { resumeId, experienceId } = params;

    if (!resumeId || !experienceId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Get the resume to verify ownership
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume || resume.userId !== user.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the experience belongs to this resume
    const experience = await prisma.resumeExperience.findFirst({
      where: { 
        id: experienceId,
        resumeId: resume.id 
      }
    });

    if (!experience) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 });
    }

    // Delete the experience
    await prisma.resumeExperience.delete({
      where: { id: experienceId }
    });

    // Invalidate dashboard cache
    await invalidateDashboardInsights(user.sub);

    // Revalidate paths
    revalidatePath(`/resume/${resumeId}/edit`);
    revalidatePath(`/resume/${resumeId}`);

    return NextResponse.json({ 
      success: true, 
      message: "Experience deleted successfully!" 
    });
  } catch (error) {
    console.error("Failed to delete experience:", error);
    return NextResponse.json(
      { error: "Failed to delete experience", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
