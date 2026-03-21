import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest, buildApiPreflightResponse } from "@/lib/api-request-auth";
import { attachUploadedImageToQrForUser, getQRByIdForUser } from "@/lib/qr-service";
import { buildUploadObjectKey, createStorageClient, MAX_UPLOAD_SIZE_BYTES } from "@/lib/storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeApiRequest(request, ["qr:read"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await params;
  const qr = await getQRByIdForUser(authorization.value.auth.userId, id);
  const imageKey = qr?.data.imageKey;

  if (!qr || !imageKey) {
    return NextResponse.json({ error: "QR image not found" }, {
      status: 404,
      headers: authorization.value.corsHeaders,
    });
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
      return NextResponse.json({ error: "QR image not found" }, {
        status: 404,
        headers: authorization.value.corsHeaders,
      });
    }

    const bytes = await result.Body.transformToByteArray();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        ...authorization.value.corsHeaders,
        "Content-Type": result.ContentType || "application/octet-stream",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("Failed to load QR image:", error);
    return NextResponse.json({ error: "Failed to load QR image" }, {
      status: 500,
      headers: authorization.value.corsHeaders,
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeApiRequest(request, ["qr:write"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await params;
  const qr = await getQRByIdForUser(authorization.value.auth.userId, id);
  if (!qr) {
    return NextResponse.json({ error: "QR code not found" }, {
      status: 404,
      headers: authorization.value.corsHeaders,
    });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Invalid form data" }, {
      status: 400,
      headers: authorization.value.corsHeaders,
    });
  }

  if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File must be between 1 byte and ${MAX_UPLOAD_SIZE_BYTES} bytes` },
      {
        status: 413,
        headers: authorization.value.corsHeaders,
      },
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files can be used here" }, {
      status: 400,
      headers: authorization.value.corsHeaders,
    });
  }

  const s3 = createStorageClient();
  const key = buildUploadObjectKey(authorization.value.auth.userId, qr.id, file.name, "images");
  const body = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: file.type,
    }),
  );

  const updatedQr = await attachUploadedImageToQrForUser(authorization.value.auth.userId, qr.id, key);
  if (!updatedQr) {
    return NextResponse.json({ error: "Failed to update QR image" }, {
      status: 500,
      headers: authorization.value.corsHeaders,
    });
  }

  return NextResponse.json({
    data: updatedQr,
    key,
    url: `${request.nextUrl.origin}/api/v1/qr-codes/${qr.id}/image?v=${encodeURIComponent(key)}`,
  }, {
    headers: authorization.value.corsHeaders,
  });
}

export async function OPTIONS(request: NextRequest) {
  return buildApiPreflightResponse(request);
}
