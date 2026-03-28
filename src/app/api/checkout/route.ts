import { NextResponse } from "next/server";

import { stackServerApp } from "@/stack";

export async function POST() {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  return NextResponse.json({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?plan=creator`,
  });
}
