import { type NextRequest, NextResponse } from "next/server";

import { ProductValidationError, createProductForUser } from "@/lib/products";
import { productImportSchema } from "@/lib/product-validation";
import { BillingAccessError } from "@/lib/billing";
import { stackServerApp } from "@/stack";

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = productImportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid import payload" }, { status: 400 });
  }

  const created = [];
  const errors = [];

  for (const row of parsed.data.rows) {
    try {
      created.push(await createProductForUser(user.id, {
        ...row,
        customDomainId: parsed.data.customDomainId ?? null,
      }));
    } catch (error) {
      if (error instanceof BillingAccessError) {
        return NextResponse.json({ error: error.message, code: error.code, requiredTier: error.requiredTier }, { status: error.status });
      }
      errors.push({
        row: row.row,
        identifier: row.identifierSubmitted,
        reason: error instanceof ProductValidationError
          ? error.message
          : error instanceof Error && /already in use|already exists|slug/i.test(error.message)
            ? "A product with this GTIN already exists on the selected domain"
            : "Could not create this product",
      });
    }
  }

  return NextResponse.json({ created, errors });
}
