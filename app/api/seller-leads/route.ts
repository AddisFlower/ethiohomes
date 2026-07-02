import { NextResponse } from "next/server";
import { createSellerLead, SellerLeadError } from "@/lib/seller-leads";

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
    throw new SellerLeadError(
      "Too many seller requests. Please wait a few minutes before trying again.",
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
      throw new SellerLeadError("Seller request is too large.", 413);
    }

    assertWithinRateLimit(request);

    const body = await request.json().catch(() => {
      throw new SellerLeadError("Request body must be valid JSON.");
    });
    const sellerLead = await createSellerLead(body);

    return NextResponse.json({ sellerLead });
  } catch (error) {
    const status = error instanceof SellerLeadError ? error.status : 500;

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit seller request.",
      },
      { status }
    );
  }
}
