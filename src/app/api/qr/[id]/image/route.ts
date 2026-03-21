export const runtime = "nodejs";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { getQRByIdForUser } from "@/lib/qr-service";
import { createStorageClient } from "@/lib/storage";
import { stackServerApp } from "@/stack";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const qr = await getQRByIdForUser(user.id, id);
  const imageKey = qr?.data.imageKey;

  if (!qr || !imageKey) {
    return NextResponse.json({ error: "QR image not found" }, { status: 404 });
  }

  try {
    const storage = createStorageClient();
    const result = await storage.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: imageKey,
      }),
    );

    if (!result.Body) {
      return NextResponse.json({ error: "QR image not found" }, { status: 404 });
    }

    const bytes = await result.Body.transformToByteArray();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": result.ContentType || "application/octet-stream",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("Failed to load QR image:", error);
    return NextResponse.json({ error: "Failed to load QR image" }, { status: 500 });
  }
}
