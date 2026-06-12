import { NextResponse } from "next/server";
import { getAppSession, isAuthenticated } from "@/lib/auth";
import {
  createShowingRequest,
  getAgentContactEmail,
} from "@/lib/showing-requests";

export async function POST(request: Request) {
  try {
    const session = await getAppSession();
    const body = await request.json();
    const showingRequest = await createShowingRequest(
      body,
      isAuthenticated(session) ? session.user.id : undefined,
      isAuthenticated(session) ? session.accessToken : undefined
    );
    let agentContactEmail: string | null = null;

    try {
      agentContactEmail = await getAgentContactEmail(
        showingRequest.agentOwnerId
      );
    } catch (error) {
      console.error(
        "[EthioMLS] Agent contact email lookup failed.",
        error
      );
    }

    return NextResponse.json({ showingRequest, agentContactEmail });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit showing request.",
      },
      { status: 400 }
    );
  }
}
