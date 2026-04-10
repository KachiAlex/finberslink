import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "../../../../../lib/auth/guards";
import { createRateLimit, rateLimitPresets } from "../../../../../lib/security/rate-limit";
import { prisma } from "../../../../../lib/prisma";
import { verifyToken } from "../../../../../lib/auth/jwt";

export const runtime = "nodejs";

const ResourceSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  title: z.string().min(1, "Title is required"),
  type: z.enum(["pdf", "video", "image", "document", "other"]),
  url: z.string().url("Valid URL is required"),
  description: z.string().optional(),
  size: z.number().positive().optional(),
});

const rateLimitMiddleware = createRateLimit(rateLimitPresets.api);

/**
 * GET /api/courses/[courseId]/resources
 * Get all resources for a specific course
 */
export const GET = rateLimitMiddleware(async (request: NextRequest, { params }: { params: { courseId: string } }) => {
  try {
    const session = requireAuth(request);
    const { courseId } = params;

    // Verify user has access to this course
    const course = await prisma.course.findFirst({
      where: { id: courseId },
      include: {
        enrollments: {
          where: { userId: session.sub }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const hasAccess = course.enrollments?.some(enrollment => enrollment.userId === session.sub);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get resources for this course
    const resources = await prisma.courseResource.findMany({
      where: { courseId },
      orderBy: { uploadedAt: "desc" }
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Failed to fetch resources:", error);
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
  }
});

/**
 * POST /api/courses/[courseId]/resources
 * Upload a new resource to a course
 */
export const POST = rateLimitMiddleware(async (request: NextRequest, { params }: { params: { courseId: string } }) => {
  try {
    const session = requireAuth(request);
    const { courseId } = params;

    // Verify user is instructor or admin
    const user = await prisma.user.findUnique({
      where: { id: session.sub }
    });

    if (!user || (user.role !== "TUTOR" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Verify course ownership or admin access
    const course = await prisma.course.findFirst({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const hasAccess = user.role === "ADMIN" || course.instructorId === session.sub;
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const data = await request.formData();
    const file = data.get("file");
    const title = data.get("title") as string;
    const description = data.get("description") as string;
    const type = data.get("type") as string;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Validate input
    const validatedData = ResourceSchema.parse({
      courseId,
      title: title || file.name,
      type: type || "other",
      url: "", // Will be set after upload
      description: description || undefined,
      size: file.size,
    });

    // Upload file to your storage (Cloudinary, S3, etc.)
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type || `application/${fileExtension}`;

    let uploadUrl: string;
    
    try {
      // For now, we'll simulate upload - replace with actual upload logic
      uploadUrl = `https://your-storage-domain.com/uploads/${courseId}/${Date.now()}-${file.name}`;
      
      // TODO: Replace with actual upload service
      // const uploadResult = await cloudinary.uploader.upload(`data:${mimeType};base64,${buffer.toString("base64")}`, {
      //   folder: `resources/${courseId}`,
      //   resource_type: "auto"
      // });
      // uploadUrl = uploadResult.secure_url;
      
      console.log("File uploaded:", { fileName: file.name, size: file.size, type: validatedData.type });
      
    } catch (uploadError) {
      console.error("Upload failed:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Save resource to database
    const resource = await prisma.courseResource.create({
      data: {
        courseId: validatedData.courseId,
        title: validatedData.title,
        type: validatedData.type as any,
        url: uploadUrl,
        description: validatedData.description,
        size: validatedData.size,
        uploadedAt: new Date(),
      }
    });

    return NextResponse.json({ 
      message: "Resource uploaded successfully",
      resource 
    });
  } catch (error) {
    console.error("Failed to upload resource:", error);
    return NextResponse.json({ error: "Failed to upload resource" }, { status: 500 });
  }
});
