import { NextResponse } from "next/server";
import {
  canUseAdminFeatures,
  getAdminAccessDenial,
  getAppSession,
} from "@/lib/auth";
import { assignSellerLead, SellerLeadError } from "@/lib/seller-leads";

type AssignmentRequestBody = {
  agentId?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAppSession();
    const denial = getAdminAccessDenial(session);
    const adminSession = canUseAdminFeatures(session) ? session : null;

    if (denial || !adminSession) {
      return NextResponse.json(
        { error: denial?.error ?? "Access denied." },
        { status: denial?.status ?? 403 }
      );
    }

    const { id } = await params;
    const body = (await request.json()) as AssignmentRequestBody;

    if (!body.agentId) {
      return NextResponse.json(
        { error: "Agent is required." },
        { status: 400 }
      );
    }

    const sellerLead = await assignSellerLead(id, body.agentId);

    return NextResponse.json({ sellerLead });
  } catch (error) {
    const status = error instanceof SellerLeadError ? error.status : 500;

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to assign seller lead.",
      },
      { status }
    );
  }
}
