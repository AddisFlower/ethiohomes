import { NextResponse } from "next/server";
import { canUseAgentFeatures, getAppSession } from "@/lib/auth";
import { createListing } from "@/lib/listings";

export async function POST(request: Request) {
  try {
    const session = await getAppSession();

    if (!canUseAgentFeatures(session) || !session.user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const formData = await request.formData();
    const listing = await createListing(
      formData,
      session.user.id,
      session.profile.full_name ?? session.user.email ?? "EthioMLS Agent"
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
