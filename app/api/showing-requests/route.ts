import { NextResponse } from "next/server";
import { getAppSession, isAuthenticated } from "@/lib/auth";
import {
  createShowingRequest,
  getAgentContactEmail,
  ShowingRequestError,
} from "@/lib/showing-requests";

const maxRequestBytes = 8_192;
const rateLimitWindowMs = 10 * 60 * 1000;
const maxRequestsPerWindow = 5;
const requestTimestampsByIp = new Map<string, number[]>();

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function assertWithinRateLimit(request: Request) {
  const ip = getClientIp(request);
  const now = Date.now();
  const cutoff = now - rateLimitWindowMs;
  const timestamps = (requestTimestampsByIp.get(ip) ?? []).filter(
    (timestamp) => timestamp >= cutoff
  );

  if (timestamps.length >= maxRequestsPerWindow) {
    throw new ShowingRequestError(
      "Too many showing requests. Please wait a few minutes before trying again.",
      429
    );
  }

  timestamps.push(now);
  requestTimestampsByIp.set(ip, timestamps);
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);

    if (contentLength > maxRequestBytes) {
      throw new ShowingRequestError("Showing request is too large.", 413);
    }

    assertWithinRateLimit(request);

    const session = await getAppSession();
    const body = await request.json().catch(() => {
      throw new ShowingRequestError("Request body must be valid JSON.");
    });
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
    const status =
      error instanceof ShowingRequestError ? error.status : 400;

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit showing request.",
      },
      { status }
    );
  }
}
