import { NextResponse } from "next/server";
import {
  canUseAgentFeatures,
  getAgentAccessDenial,
  getAppSession,
} from "@/lib/auth";
import { sendListingAlertNow } from "@/lib/client-alerts";
import { getListingsForViewer } from "@/lib/listings";

function getSiteUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    new URL(request.url).origin
  );
}

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

    const { clientId, includePreviouslySent, previewListingIds } = (await request
      .json()
      .catch(() => ({}))) as {
      clientId?: string;
      includePreviouslySent?: boolean;
      previewListingIds?: string[];
    };

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required." },
        { status: 400 }
      );
    }

    const listings = await getListingsForViewer(
      agentSession.role,
      agentSession.user.id,
      agentSession.accessToken
    );
    const result = await sendListingAlertNow({
      clientId,
      includePreviouslySent: includePreviouslySent === true,
      listings,
      previewListingIds: Array.isArray(previewListingIds)
        ? previewListingIds.filter((id) => typeof id === "string")
        : undefined,
      session: agentSession,
      siteUrl: getSiteUrl(request),
    });

    return NextResponse.json(result, { status: result.status });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send listing alert.",
      },
      { status: 500 }
    );
  }
}
