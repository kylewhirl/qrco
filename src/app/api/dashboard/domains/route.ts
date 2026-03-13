import { NextRequest, NextResponse } from "next/server";
import { StackServerApp } from "@stackframe/stack";
import { createCustomDomainForUser, listCustomDomainsForUser } from "@/lib/custom-domains";
import { getDomainConnectState } from "@/lib/domain-connect";
import { customDomainCreateSchema } from "@/lib/qr-validation";

const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/login",
  },
});

export async function GET() {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const domains = await listCustomDomainsForUser(user.id);
    const enrichedDomains = await Promise.all(
      domains.map(async (domain) => ({
        ...domain,
        domainConnect: await getDomainConnectState(domain),
      })),
    );
    return NextResponse.json({ domains: enrichedDomains });
  } catch (error) {
    console.error("Failed to load custom domains:", error);
    return NextResponse.json({ error: "Failed to load custom domains" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = customDomainCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid hostname" }, { status: 400 });
    }

    const domain = await createCustomDomainForUser(user.id, parsed.data.hostname);
    return NextResponse.json({
      domain: {
        ...domain,
        domainConnect: await getDomainConnectState(domain),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create custom domain:", error);
    const message = error instanceof Error ? error.message : "Failed to create custom domain";
    const status = /invalid hostname/i.test(message)
      ? 400
      : /already connected/i.test(message)
        ? 409
        : 500;
    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}
