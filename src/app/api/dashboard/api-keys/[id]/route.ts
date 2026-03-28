import { NextResponse } from "next/server";
import { BillingAccessError, requireBillingFeatureForUserId } from "@/lib/billing";
import { stackServerApp } from "@/stack";
import { revokeApiKeyForUser, updateApiKeyForUser } from "@/lib/api-keys";
import { updateApiAccessTokenSchema } from "@/lib/qr-validation";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireBillingFeatureForUserId(user.id, "api_access");
  } catch (error) {
    if (error instanceof BillingAccessError) {
      return NextResponse.json(
        { error: error.message, code: error.code, requiredTier: error.requiredTier },
        { status: error.status },
      );
    }

    throw error;
  }

  try {
    const { id } = await params;
    const revoked = await revokeApiKeyForUser(user.id, id);

    if (!revoked) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, apiKey: revoked });
  } catch (error) {
    console.error("Failed to revoke API key:", error);
    return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireBillingFeatureForUserId(user.id, "api_access");
  } catch (error) {
    if (error instanceof BillingAccessError) {
      return NextResponse.json(
        { error: error.message, code: error.code, requiredTier: error.requiredTier },
        { status: error.status },
      );
    }

    throw error;
  }

  try {
    const parsed = updateApiAccessTokenSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { id } = await params;
    const updated = await updateApiKeyForUser(user.id, id, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({ apiKey: updated });
  } catch (error) {
    console.error("Failed to update API key:", error);
    return NextResponse.json({ error: "Failed to update API key" }, { status: 500 });
  }
}
