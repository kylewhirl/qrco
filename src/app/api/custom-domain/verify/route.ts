import { NextRequest, NextResponse } from "next/server";
import { StackServerApp } from "@stackframe/stack";
import { promises as dns } from "dns";

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

  const token = user.serverMetadata?.customDomainToken;
  if (!token) {
    return NextResponse.json({ error: "No domain pending verification" }, { status: 400 });
  }

  try {
    const records = await dns.resolveTxt(`_qrco.${domain}`);
    const flattened = records.map((r) => r.join(""));
    const verified = flattened.includes(token);
    if (!verified) {
      return NextResponse.json({ error: "Verification record not found" }, { status: 400 });
    }

    await user.update({
      serverMetadata: {
        ...(user.serverMetadata || {}),
        customDomainVerified: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DNS lookup error:", err);
    return NextResponse.json({ error: "DNS lookup failed" }, { status: 400 });
  }
}
