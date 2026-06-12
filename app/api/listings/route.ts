import { NextResponse } from "next/server";
import {
  canUseAgentFeatures,
  getAgentAccessDenial,
  getAppSession,
} from "@/lib/auth";
import { createListing } from "@/lib/listings";

export async function POST(request: Request) {
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

    const formData = await request.formData();
    const listing = await createListing(
      formData,
      agentSession.user.id,
      agentSession.profile.full_name ??
        agentSession.user.email ??
        "EthioMLS Agent",
      agentSession.accessToken
    );

    return NextResponse.json({ listing });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create listing.",
      },
      { status: 500 }
    );
  }
}
