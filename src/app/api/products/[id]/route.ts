import { type NextRequest, NextResponse } from "next/server";

import {
  deleteProductForUser,
  getProductByIdForUser,
  ProductValidationError,
  updateProductForUser,
} from "@/lib/products";
import { productUpdateSchema } from "@/lib/product-validation";
import { stackServerApp } from "@/stack";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const product = await getProductByIdForUser(user.id, id);
  return product
    ? NextResponse.json(product)
    : NextResponse.json({ error: "Product not found" }, { status: 404 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = productUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product payload" }, { status: 400 });
  }

  try {
    const product = await updateProductForUser(user.id, id, parsed.data);
    return product
      ? NextResponse.json(product)
      : NextResponse.json({ error: "Product not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof ProductValidationError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteProductForUser(user.id, id);
  return deleted
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: "Product not found" }, { status: 404 });
}
