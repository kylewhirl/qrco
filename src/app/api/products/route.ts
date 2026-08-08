import { type NextRequest, NextResponse } from "next/server";

import { getProductsForUser, createProductForUser, ProductValidationError } from "@/lib/products";
import { productCreateSchema } from "@/lib/product-validation";
import { BillingAccessError } from "@/lib/billing";
import { stackServerApp } from "@/stack";

export async function GET() {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getProductsForUser(user.id));
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = productCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product payload" }, { status: 400 });
  }

  try {
    return NextResponse.json(await createProductForUser(user.id, parsed.data));
  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof ProductValidationError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    if (error instanceof BillingAccessError) {
      return NextResponse.json({ error: error.message, code: error.code, requiredTier: error.requiredTier }, { status: error.status });
    }
    if (error instanceof Error && /already in use|already exists|slug|duplicate|unique constraint/i.test(error.message)) {
      return NextResponse.json({ error: "A product with this GTIN already exists on the selected domain.", code: "duplicate_product" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
