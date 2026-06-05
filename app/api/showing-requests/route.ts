import { NextResponse } from "next/server";
import { canUseAgentFeatures, getAppSession } from "@/lib/auth";
import { createShowingRequest } from "@/lib/showing-requests";

export async function POST(request: Request) {
  try {
    const session = await getAppSession();
    const body = await request.json();
    const showingRequest = await createShowingRequest(
      body,
      canUseAgentFeatures(session) ? session.user.id : undefined
    );

    return NextResponse.json({ showingRequest });
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
