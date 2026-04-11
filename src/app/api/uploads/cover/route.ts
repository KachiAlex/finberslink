import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth/jwt";
import { cloudinary } from "@/lib/cloudinary";

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await cloudinary.uploader.upload(`data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`, {
      folder: `covers/${user.sub}`,
      overwrite: false,
      resource_type: "image",
    });

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (err: any) {
    console.error("Cover upload error", err);
    return NextResponse.json({ error: err.message ?? "Upload failed" }, { status: 500 });
  }
}
