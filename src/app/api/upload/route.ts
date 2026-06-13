import path from "path";
import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/supabase";

function sanitiseFilename(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const allowed =
      file.type.startsWith("image/") ||
      file.type.startsWith("video/") ||
      file.name.match(/\.(jpg|jpeg|png|gif|webp|avif|mp4|mov|webm)$/i);

    if (!allowed) {
      return NextResponse.json(
        { error: "Only common image and video files are supported." },
        { status: 400 }
      );
    }

    const parsed = path.parse(file.name);
    const safeBase = sanitiseFilename(parsed.name || "upload");
    const extension = parsed.ext || (file.type.startsWith("video/") ? ".mp4" : ".jpg");
    const filename = `${Date.now()}-${safeBase}${extension}`;

    // Upload to Supabase ONLY
    const supabasePath = `uploads/${filename}`;
    const publicUrl = await uploadFile(file, supabasePath);

    if (!publicUrl) {
      return NextResponse.json({ error: "Upload succeeded but no public URL was returned." }, { status: 500 });
    }
    
    return NextResponse.json({
      url: publicUrl
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed."
      },
      { status: 500 }
    );
  }
}

