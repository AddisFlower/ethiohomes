import { NextResponse } from "next/server";
import {
  canUseAgentFeatures,
  getAgentAccessDenial,
  getAppSession,
} from "@/lib/auth";
import {
  deleteListing,
  listingNotFoundOrDeniedMessage,
  updateListing,
} from "@/lib/listings";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAppSession();
    const denial = getAgentAccessDenial(session);
    const agentSession = canUseAgentFeatures(session) ? session : null;

    if (denial || !agentSession) {
      return NextResponse.json(
        { error: denial?.error ?? "Agent profile required." },
        { status: denial?.status ?? 403 }
      );
    }

    const { id } = await params;
    const formData = await request.formData();
    const listing = await updateListing(
      id,
      formData,
      agentSession.user.id,
      agentSession.accessToken
    );

    return NextResponse.json({ listing });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update listing.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAppSession();
    const denial = getAgentAccessDenial(session);
    const agentSession = canUseAgentFeatures(session) ? session : null;

    if (denial || !agentSession) {
      return NextResponse.json(
        { error: denial?.error ?? "Agent profile required." },
        { status: denial?.status ?? 403 }
      );
    }

    const { id } = await params;
    // TODO: Replace this hard delete with soft delete if listing recovery is needed.
    await deleteListing(
      id,
      agentSession.user.id,
      agentSession.accessToken
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete listing.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: message === listingNotFoundOrDeniedMessage ? 404 : 500,
      }
    );
  }
}
