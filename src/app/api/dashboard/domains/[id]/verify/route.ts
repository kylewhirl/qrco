import { NextResponse } from "next/server";
import { StackServerApp } from "@stackframe/stack";
import { verifyCustomDomainForUser } from "@/lib/custom-domains";

const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/login",
  },
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const domain = await verifyCustomDomainForUser(user.id, id);
    if (!domain) {
      return NextResponse.json({ error: "Custom domain not found" }, { status: 404 });
    }

    return NextResponse.json({ domain });
  } catch (error) {
    console.error("Failed to verify custom domain:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to verify custom domain" },
      { status: 500 },
    );
  }
}
