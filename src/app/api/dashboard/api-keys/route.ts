import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { createApiKeyForUser, listApiKeysForUser } from "@/lib/api-keys";
import { createApiKeySchema } from "@/lib/qr-validation";

export async function GET() {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKeys = await listApiKeysForUser(user.id);
  return NextResponse.json({ apiKeys });
}

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = createApiKeySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const result = await createApiKeyForUser(user.id, parsed.data.name);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create API key:", error);
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}
