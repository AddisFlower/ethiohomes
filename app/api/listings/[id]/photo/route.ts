import { NextResponse } from "next/server";
import {
  canUseAgentFeatures,
  getAgentAccessDenial,
  getAppSession,
} from "@/lib/auth";
import { updateListingPhoto } from "@/lib/listings";

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
    const listing = await updateListingPhoto(
      id,
      formData,
      agentSession.user.id
    );

    return NextResponse.json({ listing });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update listing photo.",
      },
      { status: 500 }
    );
  }
}
