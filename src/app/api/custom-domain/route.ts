import { NextRequest, NextResponse } from "next/server";
import { StackServerApp } from "@stackframe/stack";
import { randomBytes } from "crypto";

const stack = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: { signIn: "/login" },
});

export async function POST(request: NextRequest) {
  const { domain } = await request.json();
  if (!domain) {
    return NextResponse.json({ error: "Domain is required" }, { status: 400 });
  }

  const user = await stack.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = randomBytes(16).toString("hex");

  await user.update({
    serverMetadata: {
      ...(user.serverMetadata || {}),
      customDomain: domain,
      customDomainToken: token,
      customDomainVerified: false,
    },
  });

  return NextResponse.json({ token });
}
