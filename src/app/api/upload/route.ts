export const runtime = 'nodejs';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { attachUploadedFileToQrForUser, attachUploadedImageToQrForUser, getQRByCodeForUser, getQRByIdForUser } from "@/lib/qr-service";
import { buildUploadObjectKey, createStorageClient, MAX_UPLOAD_SIZE_BYTES } from "@/lib/storage";

export async function POST(request: Request) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const code = formData.get("code");
  const qrId = formData.get("qrId");
  const purpose = formData.get("purpose");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File must be between 1 byte and ${MAX_UPLOAD_SIZE_BYTES} bytes` },
      { status: 413 },
    );
  }

  const isImageUpload = purpose === "image";
  const qr = isImageUpload
    ? typeof qrId === "string"
      ? await getQRByIdForUser(user.id, qrId)
      : null
    : typeof code === "string"
      ? await getQRByCodeForUser(user.id, code)
      : null;

  if (!qr) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  if (isImageUpload && !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files can be used here" }, { status: 400 });
  }

  const s3 = createStorageClient();

  const key = buildUploadObjectKey(user.id, qr.id, file.name, isImageUpload ? "images" : "files");
  const body = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: file.type,
    })
  );

  const updatedQr = isImageUpload
    ? await attachUploadedImageToQrForUser(user.id, qr.id, key)
    : await attachUploadedFileToQrForUser(user.id, code as string, key);

  return NextResponse.json({
    key,
    qrId: qr.id,
    url: updatedQr?.imageUrl ?? null,
    qr: updatedQr,
    updated: Boolean(updatedQr),
  });
}
