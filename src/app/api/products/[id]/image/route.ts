import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { BillingAccessError, requireBillingFeatureForUserId } from "@/lib/billing";
import {
  attachUploadedImageToProductForUser,
  getProductByIdForUser,
  getPublicProduct,
} from "@/lib/products";
import { buildUploadObjectKey, createStorageClient, MAX_UPLOAD_SIZE_BYTES } from "@/lib/storage";
import { stackServerApp } from "@/stack";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = await getPublicProduct(id);
  const imageKey = product?.content.imageKey;

  if (!product || !imageKey) {
    return NextResponse.json({ error: "Product image not found" }, { status: 404 });
  }

  try {
    const result = await createStorageClient().send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: imageKey,
      }),
    );

    if (!result.Body) {
      return NextResponse.json({ error: "Product image not found" }, { status: 404 });
    }

    const bytes = await result.Body.transformToByteArray();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": result.ContentType || "application/octet-stream",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Failed to load product image:", error);
    return NextResponse.json({ error: "Failed to load product image" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireBillingFeatureForUserId(user.id, "file_uploads");
  } catch (error) {
    if (error instanceof BillingAccessError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    throw error;
  }

  const { id } = await params;
  const product = await getProductByIdForUser(user.id, id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json({ error: `File must be between 1 byte and ${MAX_UPLOAD_SIZE_BYTES} bytes` }, { status: 413 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files can be used here" }, { status: 400 });
  }

  const key = buildUploadObjectKey(user.id, product.qrId, file.name, "images");
  await createStorageClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    }),
  );

  const updatedProduct = await attachUploadedImageToProductForUser(user.id, id, key);
  if (!updatedProduct) {
    return NextResponse.json({ error: "Failed to update product image" }, { status: 500 });
  }

  return NextResponse.json({
    ...updatedProduct,
    key,
    imageUrl: `${request.url.replace(/\/api\/products\/[^/]+\/image$/, "")}/api/products/${id}/image`,
  });
}
