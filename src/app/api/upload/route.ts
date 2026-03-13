export const runtime = 'nodejs';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { attachUploadedFileToQrForUser, getQRByCodeForUser } from "@/lib/qr-service";
import { buildUploadObjectKey, MAX_UPLOAD_SIZE_BYTES } from "@/lib/storage";

export async function POST(request: Request) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const code = formData.get("code");

  if (!(file instanceof File) || typeof code !== "string") {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File must be between 1 byte and ${MAX_UPLOAD_SIZE_BYTES} bytes` },
      { status: 413 },
    );
  }

  const qr = await getQRByCodeForUser(user.id, code);
  if (!qr) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: false,
  });

  const key = buildUploadObjectKey(user.id, qr.id, file.name);
  const body = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: file.type,
    })
  );

  const updatedQr = await attachUploadedFileToQrForUser(user.id, code, key);

  return NextResponse.json({
    key,
    qrId: qr.id,
    updated: Boolean(updatedQr),
  });
}
