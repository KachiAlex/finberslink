import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth/jwt";
import { updateResume } from "../../../../features/resume/service";
import { invalidateDashboardInsights } from "../../../../features/dashboard/service";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    const formData = await request.formData();
    
    const slug = String(formData.get("slug") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const personaName = String(formData.get("personaName") ?? "").trim();
    const summary = String(formData.get("summary") ?? "").trim();
    const introVideoUrl = String(formData.get("introVideoUrl") ?? "").trim();
    const headshotUrl = String(formData.get("headshotUrl") ?? "").trim();

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    // Update the resume with provided fields
    const updateData: any = {};
    if (title) updateData.title = title;
    if (personaName !== "") updateData.personaName = personaName || undefined;
    if (summary !== "") updateData.summary = summary;
    if (introVideoUrl) updateData.introVideoUrl = introVideoUrl || null;
    if (headshotUrl) updateData.headshotUrl = headshotUrl || null;

    await updateResume(slug, updateData);

    // Invalidate dashboard cache
    await invalidateDashboardInsights(user.sub);

    // Revalidate paths
    revalidatePath(`/resume/${slug}/edit`);
    revalidatePath(`/resume/${slug}`);

    return NextResponse.json({ 
      success: true, 
      message: "Resume updated successfully!",
      data: updateData 
    });
  } catch (error) {
    console.error("Failed to update resume:", error);
    return NextResponse.json(
      { error: "Failed to update resume", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
