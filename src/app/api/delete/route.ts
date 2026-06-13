import { NextResponse } from "next/server";
import { deleteFileByUrl } from "@/lib/supabase";

export async function DELETE(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required." },
        { status: 400 }
      );
    }

    const success = await deleteFileByUrl(url);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete file.", warning: "File may not exist or URL format is invalid." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Delete failed."
      },
      { status: 500 }
    );
  }
}
