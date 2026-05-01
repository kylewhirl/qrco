import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest, buildApiPreflightResponse } from "@/lib/api-request-auth";
import { BillingAccessError } from "@/lib/billing";
import { createQRCodeForUser, getAllQRCodesForUser, QRSlugUnavailableError, QRSlugValidationError } from "@/lib/qr-service";
import { qrMutationRequestSchema } from "@/lib/qr-validation";

export async function GET(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["qr:read"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const qrCodes = await getAllQRCodesForUser(authorization.value.auth.userId);
    return NextResponse.json({ data: qrCodes }, { headers: authorization.value.corsHeaders });
  } catch (error) {
    console.error("Failed to list QR codes:", error);
    return NextResponse.json({ error: "Failed to list QR codes" }, {
      status: 500,
      headers: authorization.value.corsHeaders,
    });
  }
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["qr:write"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const parsed = qrMutationRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid QR payload" }, {
        status: 400,
        headers: authorization.value.corsHeaders,
      });
    }

    const qrCode = await createQRCodeForUser(
      authorization.value.auth.userId,
      parsed.data.data,
      parsed.data.customDomainId,
      parsed.data.customSlug,
    );
    return NextResponse.json({ data: qrCode }, {
      status: 201,
      headers: authorization.value.corsHeaders,
    });
  } catch (error) {
    console.error("Failed to create QR code:", error);
    if (error instanceof BillingAccessError) {
      return NextResponse.json(
        { error: error.message, code: error.code, requiredTier: error.requiredTier },
        {
          status: error.status,
          headers: authorization.value.corsHeaders,
        },
      );
    }
    if (error instanceof QRSlugUnavailableError || error instanceof QRSlugValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        {
          status: error.status,
          headers: authorization.value.corsHeaders,
        },
      );
    }

    return NextResponse.json({ error: "Failed to create QR code" }, {
      status: 500,
      headers: authorization.value.corsHeaders,
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildApiPreflightResponse(request);
}
