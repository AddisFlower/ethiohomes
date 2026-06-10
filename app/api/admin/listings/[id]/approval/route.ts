import { NextResponse } from "next/server";
import {
  canUseAdminFeatures,
  getAdminAccessDenial,
  getAppSession,
} from "@/lib/auth";
import { updateListingApproval } from "@/lib/listings";

type ApprovalRequestBody = {
  action?: string;
  rejectionReason?: string;
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
    const body = (await request.json()) as ApprovalRequestBody;

    if (body.action !== "approve" && body.action !== "reject") {
      return NextResponse.json(
        { error: "Approval action must be approve or reject." },
        { status: 400 }
      );
    }

    const listing = await updateListingApproval(
      id,
      body.action === "approve" ? "Approved" : "Rejected",
      body.rejectionReason
    );

    return NextResponse.json({ listing });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update listing approval.",
      },
      { status: 500 }
    );
  }
}
