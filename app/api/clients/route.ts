import { NextResponse } from "next/server";
import {
  canUseAgentFeatures,
  getAgentAccessDenial,
  getAppSession,
} from "@/lib/auth";
import { createAgentClient } from "@/lib/clients";

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
    const client = await createAgentClient(
      formData,
      agentSession.user.id,
      agentSession.accessToken
    );

    return NextResponse.json({ client });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create client.",
      },
      { status: 500 }
    );
  }
}
