import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest, buildApiPreflightResponse } from "@/lib/api-request-auth";
import { createStylePresetForUser, listStylePresetsForUser } from "@/lib/brand-styles";
import { stylePresetCreateSchema } from "@/lib/qr-validation";

export async function GET(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["styles:read"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const presets = await listStylePresetsForUser(authorization.value.auth.userId);
    return NextResponse.json({ data: presets }, { headers: authorization.value.corsHeaders });
  } catch (error) {
    console.error("Failed to list style presets:", error);
    return NextResponse.json({ error: "Failed to list style presets" }, {
      status: 500,
      headers: authorization.value.corsHeaders,
    });
  }
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["styles:write"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const parsed = stylePresetCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid style preset payload" }, {
        status: 400,
        headers: authorization.value.corsHeaders,
      });
    }

    const preset = await createStylePresetForUser(authorization.value.auth.userId, {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      isDefault: parsed.data.isDefault ?? false,
      config: parsed.data.config,
    });

    return NextResponse.json({ data: preset }, {
      status: 201,
      headers: authorization.value.corsHeaders,
    });
  } catch (error) {
    console.error("Failed to create style preset:", error);
    return NextResponse.json({ error: "Failed to create style preset" }, {
      status: 500,
      headers: authorization.value.corsHeaders,
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildApiPreflightResponse(request);
}
