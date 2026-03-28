import { NextRequest, NextResponse } from "next/server";
import { BillingAccessError, requireBillingFeatureForUserId } from "@/lib/billing";
import { stackServerApp } from "@/stack";
import { createPublishableTokenForUser, listPublishableTokensForUser } from "@/lib/api-keys";
import { createPublishableTokenSchema } from "@/lib/qr-validation";

export async function GET() {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireBillingFeatureForUserId(user.id, "api_access");
  } catch (error) {
    if (error instanceof BillingAccessError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          requiredTier: error.requiredTier,
        },
        { status: error.status },
      );
    }

    throw error;
  }

  const tokens = await listPublishableTokensForUser(user.id);
  return NextResponse.json({ tokens });
}

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireBillingFeatureForUserId(user.id, "api_access");
  } catch (error) {
    if (error instanceof BillingAccessError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          requiredTier: error.requiredTier,
        },
        { status: error.status },
      );
    }

    throw error;
  }

  try {
    const parsed = createPublishableTokenSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const result = await createPublishableTokenForUser(user.id, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create publishable token:", error);
    return NextResponse.json({ error: "Failed to create publishable token" }, { status: 500 });
  }
}
