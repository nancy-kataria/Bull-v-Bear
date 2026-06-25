import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BUCKET = "ticker-documents";
const SIGNED_URL_TTL_SECONDS = 300;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  try {
    const { docId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const document = await prisma.tickerDocument.findFirst({
      where: { id: docId, userId: user.id },
    });
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(document.fileUrl, SIGNED_URL_TTL_SECONDS);

    if (error || !data) {
      console.error("Failed to create signed URL:", error);
      return NextResponse.json(
        { error: "Failed to create file link" },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    console.error("Error creating signed URL:", error);
    return NextResponse.json(
      { error: "Failed to create file link" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  try {
    const { docId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const document = await prisma.tickerDocument.findFirst({
      where: { id: docId, userId: user.id },
    });
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const { error: removeError } = await supabase.storage
      .from(BUCKET)
      .remove([document.fileUrl]);
    if (removeError) {
      // Log but proceed — we still want to remove the DB record so it doesn't
      // dangle pointing at a file the user expects to be gone.
      console.error("Failed to remove storage object:", removeError);
    }

    await prisma.tickerDocument.delete({ where: { id: document.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 },
    );
  }
}
