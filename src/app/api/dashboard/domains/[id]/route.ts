import { NextResponse } from "next/server";
import { StackServerApp } from "@stackframe/stack";
import { deleteCustomDomainForUser } from "@/lib/custom-domains";

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
