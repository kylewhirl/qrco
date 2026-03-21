import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { revokeApiKeyForUser } from "@/lib/api-keys";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const revoked = await revokeApiKeyForUser(user.id, id);

    if (!revoked) {
      return NextResponse.json({ error: "Publishable token not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, token: revoked });
  } catch (error) {
    console.error("Failed to revoke publishable token:", error);
    return NextResponse.json({ error: "Failed to revoke publishable token" }, { status: 500 });
  }
}
