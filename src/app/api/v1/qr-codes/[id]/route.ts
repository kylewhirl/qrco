import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest, buildApiPreflightResponse } from "@/lib/api-request-auth";
import { BillingAccessError } from "@/lib/billing";
import { deleteQRForUser, getQRByIdForUser, QRSlugUnavailableError, QRSlugValidationError, updateQRDataForUser } from "@/lib/qr-service";
import { qrMutationRequestSchema } from "@/lib/qr-validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeApiRequest(request, ["qr:read"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const { id } = await params;
    const qrCode = await getQRByIdForUser(authorization.value.auth.userId, id);
    if (!qrCode) {
      return NextResponse.json({ error: "QR code not found" }, {
        status: 404,
        headers: authorization.value.corsHeaders,
      });
    }

    return NextResponse.json({ data: qrCode }, { headers: authorization.value.corsHeaders });
  } catch (error) {
    console.error("Failed to get QR code:", error);
    return NextResponse.json({ error: "Failed to get QR code" }, {
      status: 500,
      headers: authorization.value.corsHeaders,
    });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const qrCode = await updateQRDataForUser(
      authorization.value.auth.userId,
      id,
      parsed.data.data,
      parsed.data.customDomainId,
      parsed.data.customSlug,
    );
    if (!qrCode) {
      return NextResponse.json({ error: "QR code not found" }, {
        status: 404,
        headers: authorization.value.corsHeaders,
      });
    }

    return NextResponse.json({ data: qrCode }, { headers: authorization.value.corsHeaders });
  } catch (error) {
    console.error("Failed to update QR code:", error);
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

    return NextResponse.json({ error: "Failed to update QR code" }, {
      status: 500,
      headers: authorization.value.corsHeaders,
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeApiRequest(request, ["qr:write"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const { id } = await params;
    const deleted = await deleteQRForUser(authorization.value.auth.userId, id);
    if (!deleted) {
      return NextResponse.json({ error: "QR code not found" }, {
        status: 404,
        headers: authorization.value.corsHeaders,
      });
    }

    return NextResponse.json({ success: true }, { headers: authorization.value.corsHeaders });
  } catch (error) {
    console.error("Failed to delete QR code:", error);
    return NextResponse.json({ error: "Failed to delete QR code" }, {
      status: 500,
      headers: authorization.value.corsHeaders,
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildApiPreflightResponse(request);
}
