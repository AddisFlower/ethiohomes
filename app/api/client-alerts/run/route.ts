import { NextResponse } from "next/server";
import {
  assertClientAlertRunSecret,
  runScheduledClientAlerts,
} from "@/lib/client-alert-runner";

function getSiteUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    new URL(request.url).origin
  );
}

function getSecret(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";

  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim();
  }

  return request.headers.get("x-client-alert-run-secret");
}

export async function POST(request: Request) {
  try {
    assertClientAlertRunSecret(getSecret(request));

    const body = (await request.json().catch(() => ({}))) as {
      dryRun?: boolean;
      limit?: unknown;
    };
    const result = await runScheduledClientAlerts({
      dryRun: body.dryRun !== false,
      limit: body.limit,
      siteUrl: getSiteUrl(request),
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 207 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to run listing alerts.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: message.includes("secret") ? 401 : 500,
      }
    );
  }
}
