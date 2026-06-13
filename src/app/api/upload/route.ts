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
      console.error("Upload failed: No file in form data");
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    console.log(`Upload attempt: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

    // Check file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      console.error(`File too large: ${file.size} bytes (max: ${MAX_FILE_SIZE})`);
      return NextResponse.json(
        { error: `File too large. Maximum size is 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.` },
        { status: 400 }
      );
    }

    const allowed =
      file.type.startsWith("image/") ||
      file.type.startsWith("video/") ||
      file.name.match(/\.(jpg|jpeg|png|gif|webp|avif|mp4|mov|webm)$/i);

    if (!allowed) {
      console.error(`Invalid file type: ${file.type}`);
      return NextResponse.json(
        { error: "Only common image and video files are supported." },
        { status: 400 }
      );
    }

    const parsed = path.parse(file.name);
    const safeBase = sanitiseFilename(parsed.name || "upload");
    const extension = parsed.ext || (file.type.startsWith("video/") ? ".mp4" : ".jpg");
    const filename = `${Date.now()}-${safeBase}${extension}`;

    console.log(`Uploading to Supabase: uploads/${filename}`);

    // Upload to Supabase ONLY
    const supabasePath = `uploads/${filename}`;
    const publicUrl = await uploadFile(file, supabasePath);

    if (!publicUrl) {
      console.error("Upload succeeded but no public URL returned");
      return NextResponse.json({ error: "Upload succeeded but no public URL was returned." }, { status: 500 });
    }
    
    console.log(`Upload successful: ${publicUrl}`);
    
    return NextResponse.json({
      url: publicUrl
    });
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json(
      {
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
