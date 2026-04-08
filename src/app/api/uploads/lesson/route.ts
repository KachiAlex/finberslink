import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth/jwt";
import { cloudinary } from "@/lib/cloudinary";

const RESOURCE_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const VIDEO_MAX_SIZE_BYTES = 250 * 1024 * 1024; // 250MB

type UploadIntent = "resource" | "lessonVideo";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (user.role !== "TUTOR") return NextResponse.json({ error: "Tutor access required" }, { status: 403 });

    const data = await req.formData();
    const file = data.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const rawIntent = data.get("intent");
    const intent: UploadIntent = rawIntent === "lessonVideo" ? "lessonVideo" : "resource";
    const maxSize = intent === "lessonVideo" ? VIDEO_MAX_SIZE_BYTES : RESOURCE_MAX_SIZE_BYTES;
    if (file.size > maxSize) {
      const humanLimit = intent === "lessonVideo" ? "250MB" : "10MB";
      return NextResponse.json({ error: `File too large (max ${humanLimit})` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await cloudinary.uploader.upload(
      `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`,
      {
        folder: intent === "lessonVideo" ? `lesson-videos/${user.sub}` : `lessons/${user.sub}`,
        overwrite: false,
        resource_type: intent === "lessonVideo" ? "video" : "auto",
      },
    );

    return NextResponse.json({ url: uploadResult.secure_url, name: file.name, intent });
  } catch (err: any) {
    console.error("Lesson asset upload error", err);
    return NextResponse.json({ error: err.message ?? "Upload failed" }, { status: 500 });
  }
}
