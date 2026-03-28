import { NextResponse } from "next/server";
import { StackServerApp } from "@stackframe/stack";
import { BillingAccessError, requireBillingFeatureForUserId } from "@/lib/billing";
import { deleteCustomDomainForUser, updateCustomDomainFallbackForUser } from "@/lib/custom-domains";
import { getDomainConnectState } from "@/lib/domain-connect";
import { customDomainFallbackSchema } from "@/lib/qr-validation";

const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/login",
  },
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireBillingFeatureForUserId(user.id, "custom_domains");
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
    const deleted = await deleteCustomDomainForUser(user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Custom domain not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete custom domain:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete custom domain" },
      { status: 500 },
    );
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
    await requireBillingFeatureForUserId(user.id, "custom_domains");
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
    const parsed = customDomainFallbackSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid fallback URL" }, { status: 400 });
    }

    const { id } = await params;
    const domain = await updateCustomDomainFallbackForUser(user.id, id, parsed.data.fallbackUrl);
    if (!domain) {
      return NextResponse.json({ error: "Custom domain not found" }, { status: 404 });
    }

    return NextResponse.json({
      domain: {
        ...domain,
        domainConnect: await getDomainConnectState(domain),
      },
    });
  } catch (error) {
    console.error("Failed to update custom domain fallback:", error);
    const message = error instanceof Error ? error.message : "Failed to update custom domain fallback";
    const status = /fallback url cannot point to the same custom domain/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
