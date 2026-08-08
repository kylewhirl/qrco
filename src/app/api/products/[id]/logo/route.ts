import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import sharp from "sharp";
import type { Product } from "@/lib/types";

import { BillingAccessError, requireBillingFeatureForUserId } from "@/lib/billing";
import {
  attachUploadedLogoToProductForUser,
  getProductByIdForUser,
  getPublicProduct,
  ProductValidationError,
  removeUploadedLogoFromProductForUser,
} from "@/lib/products";
import { buildUploadObjectKey, createStorageClient, isOwnedUploadObjectKey, MAX_UPLOAD_SIZE_BYTES } from "@/lib/storage";
import { stackServerApp } from "@/stack";

export const runtime = "nodejs";

function logoUrl(request: Request, productId: string, updatedAt: Product["updatedAt"]): string {
  const url = new URL(`/api/products/${productId}/logo`, request.url);
  url.searchParams.set("v", new Date(updatedAt).toISOString());
  return url.toString();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = await getPublicProduct(id);
  const key = product?.pageStyle.logoKey;

  if (!product || !key || !isOwnedUploadObjectKey(key, product.userId, product.qrId, "logos")) {
    return NextResponse.json({ error: "Product logo not found" }, { status: 404 });
  }

  try {
    const result = await createStorageClient().send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      }),
    );

    if (!result.Body) {
      return NextResponse.json({ error: "Product logo not found" }, { status: 404 });
    }

    const bytes = await result.Body.transformToByteArray();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": result.ContentType || "application/octet-stream",
        "Cache-Control": "public, max-age=0, must-revalidate, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "NoSuchKey" || error.name === "NotFound" || (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404)) {
      return NextResponse.json({ error: "Product logo not found" }, { status: 404 });
    }
    console.error("Failed to load product logo:", error);
    return NextResponse.json({ error: "Failed to load product logo" }, { status: 500 });
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

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json({ error: `File must be between 1 byte and ${MAX_UPLOAD_SIZE_BYTES} bytes` }, { status: 413 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files can be used here" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  let contentType = file.type;
  if (file.type === "image/svg+xml") {
    if (!/^\s*(?:<\?xml[^>]*>\s*)?<svg\b/i.test(bytes.toString("utf8", 0, 4096))) {
      return NextResponse.json({ error: "The SVG image is not valid" }, { status: 400 });
    }
  } else {
    try {
      const metadata = await sharp(bytes).metadata();
      const supportedFormats = new Set(["avif", "gif", "jpeg", "png", "webp"]);
      if (!metadata.format || !supportedFormats.has(metadata.format) || !metadata.width || !metadata.height || metadata.width > 5000 || metadata.height > 5000) {
        return NextResponse.json({ error: "Use a valid PNG, JPEG, GIF, WebP, or AVIF logo no larger than 5,000px per side" }, { status: 400 });
      }
      contentType = metadata.format === "jpeg" ? "image/jpeg" : `image/${metadata.format}`;
    } catch {
      return NextResponse.json({ error: "The logo file could not be decoded" }, { status: 400 });
    }
  }

  const key = buildUploadObjectKey(user.id, product.qrId, file.name, "logos");
  const storage = createStorageClient();
  try {
    await storage.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: bytes,
        ContentType: contentType,
      }),
    );
  } catch {
    return NextResponse.json({ error: "Could not store product logo" }, { status: 500 });
  }

  let updatedProduct: Product | null = null;
  try {
    updatedProduct = await attachUploadedLogoToProductForUser(user.id, id, key);
  } catch (error) {
    await storage.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key })).catch(() => undefined);
    if (error instanceof ProductValidationError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    throw error;
  }
  if (!updatedProduct) {
    await storage.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key })).catch(() => undefined);
    return NextResponse.json({ error: "Failed to update product logo" }, { status: 500 });
  }

  const oldKey = product.pageStyle.logoKey;
  if (oldKey && oldKey !== key && isOwnedUploadObjectKey(oldKey, user.id, product.qrId, "logos")) {
    await storage.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: oldKey })).catch((error) => {
      console.error("Failed to delete replaced product logo:", error);
    });
  }

  return NextResponse.json({
    ...updatedProduct,
    key,
    logoUrl: logoUrl(request, id, updatedProduct.updatedAt),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await removeUploadedLogoFromProductForUser(user.id, id);
  if (!result.product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (result.key) {
    await createStorageClient().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: result.key })).catch((error) => {
      console.error("Failed to delete product logo:", error);
    });
  }

  return NextResponse.json(result.product);
}
