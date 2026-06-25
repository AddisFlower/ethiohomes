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

function getCronSecret() {
  return process.env.CRON_SECRET?.trim() ?? "";
}

function assertCronSecret(request: Request) {
  const expectedSecret = getCronSecret();
  const authorization = request.headers.get("authorization") ?? "";

  if (!expectedSecret) {
    throw new Error("CRON_SECRET is not configured.");
  }

  if (authorization !== `Bearer ${expectedSecret}`) {
    throw new Error("Invalid cron secret.");
  }
}

function getErrorStatus(message: string) {
  return message.includes("secret") ? 401 : 500;
}

async function handleClientAlertRun({
  request,
  dryRun,
  limit,
}: {
  request: Request;
  dryRun: boolean;
  limit?: unknown;
}) {
  const result = await runScheduledClientAlerts({
    dryRun,
    limit,
    siteUrl: getSiteUrl(request),
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 207 });
}

export async function GET(request: Request) {
  try {
    assertCronSecret(request);

    return await handleClientAlertRun({
      request,
      dryRun: false,
    });
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
        status: getErrorStatus(message),
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    assertClientAlertRunSecret(getSecret(request));

    const body = (await request.json().catch(() => ({}))) as {
      dryRun?: boolean;
      limit?: unknown;
    };

    return await handleClientAlertRun({
      request,
      dryRun: body.dryRun !== false,
      limit: body.limit,
    });
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
        status: getErrorStatus(message),
      }
    );
  }
}
