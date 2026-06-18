import { NextResponse } from "next/server";
import {
  canUseAgentFeatures,
  getAgentAccessDenial,
  getAppSession,
} from "@/lib/auth";
import { updateOwnProfile } from "@/lib/profiles";

export async function PATCH(request: Request) {
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

    const body = await request.json().catch(() => ({}));
    const profile = await updateOwnProfile(
      agentSession.user.id,
      agentSession.accessToken,
      body
    );

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update profile.",
      },
      { status: 400 }
    );
  }
}
