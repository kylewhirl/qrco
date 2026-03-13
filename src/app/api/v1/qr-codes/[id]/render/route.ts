import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKeyRequest } from "@/lib/api-request-auth";
import { getBrandProfileForUser, getDefaultRenderConfig, getStylePresetForUser, mergeRenderConfig } from "@/lib/brand-styles";
import { getQRByIdForUser } from "@/lib/qr-service";
import { renderQRCodeBinary, UnsafeServerLogoSourceError } from "@/lib/qr-renderer";

export const runtime = "nodejs";

function parseFormat(request: NextRequest): "svg" | "png" {
  const format = request.nextUrl.searchParams.get("format");
  return format === "png" ? "png" : "svg";
}

function parseDimension(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return Math.min(Math.max(parsed, 128), 2048);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiKeyRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const qr = await getQRByIdForUser(auth.userId, id);
    if (!qr) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    const presetId = request.nextUrl.searchParams.get("presetId");
    const format = parseFormat(request);
    const brand = await getBrandProfileForUser(auth.userId);
    const preset = presetId ? await getStylePresetForUser(auth.userId, presetId) : null;
    if (presetId && !preset) {
      return NextResponse.json({ error: "Style preset not found" }, { status: 404 });
    }

    let config = mergeRenderConfig(getDefaultRenderConfig(), brand.defaultConfig);
    config = mergeRenderConfig(config, preset?.config);

    const width = parseDimension(request.nextUrl.searchParams.get("width"));
    const height = parseDimension(request.nextUrl.searchParams.get("height"));
    if (width) {
      config.width = width;
    }
    if (height) {
      config.height = height;
    }

    const rendered = await renderQRCodeBinary(qr, config, format);
    return new NextResponse(rendered.body, {
      headers: {
        "Content-Type": rendered.contentType,
        "Cache-Control": "private, max-age=60",
        "Content-Disposition": `inline; filename="${qr.code}.${format}"`,
      },
    });
  } catch (error) {
    if (error instanceof UnsafeServerLogoSourceError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Failed to render QR code:", error);
    return NextResponse.json({ error: "Failed to render QR code" }, { status: 500 });
  }
}
