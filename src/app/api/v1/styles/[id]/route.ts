import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest, buildApiPreflightResponse } from "@/lib/api-request-auth";
import { deleteStylePresetForUser, getStylePresetForUser, updateStylePresetForUser } from "@/lib/brand-styles";
import { stylePresetUpdateSchema } from "@/lib/qr-validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeApiRequest(request, ["styles:read"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const { id } = await params;
    const preset = await getStylePresetForUser(authorization.value.auth.userId, id);
    if (!preset) {
      return NextResponse.json({ error: "Style preset not found" }, {
        status: 404,
        headers: authorization.value.corsHeaders,
      });
    }

    return NextResponse.json({ data: preset }, { headers: authorization.value.corsHeaders });
  } catch (error) {
    console.error("Failed to fetch style preset:", error);
    return NextResponse.json({ error: "Failed to fetch style preset" }, {
      status: 500,
      headers: authorization.value.corsHeaders,
    });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeApiRequest(request, ["styles:write"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const parsed = stylePresetUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid style preset payload" }, {
        status: 400,
        headers: authorization.value.corsHeaders,
      });
    }

    const { id } = await params;
    const preset = await updateStylePresetForUser(authorization.value.auth.userId, id, parsed.data);
    if (!preset) {
      return NextResponse.json({ error: "Style preset not found" }, {
        status: 404,
        headers: authorization.value.corsHeaders,
      });
    }

    return NextResponse.json({ data: preset }, { headers: authorization.value.corsHeaders });
  } catch (error) {
    console.error("Failed to update style preset:", error);
    return NextResponse.json({ error: "Failed to update style preset" }, {
      status: 500,
      headers: authorization.value.corsHeaders,
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeApiRequest(request, ["styles:write"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const { id } = await params;
    const deleted = await deleteStylePresetForUser(authorization.value.auth.userId, id);
    if (!deleted) {
      return NextResponse.json({ error: "Style preset not found" }, {
        status: 404,
        headers: authorization.value.corsHeaders,
      });
    }

    return NextResponse.json({ success: true }, { headers: authorization.value.corsHeaders });
  } catch (error) {
    console.error("Failed to delete style preset:", error);
    return NextResponse.json({ error: "Failed to delete style preset" }, {
      status: 500,
      headers: authorization.value.corsHeaders,
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildApiPreflightResponse(request);
}
