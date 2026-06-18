import {
  getScheduledAlertClients,
  type AgentClient,
} from "@/lib/clients";
import {
  sendScheduledListingAlert,
  type AlertSender,
} from "@/lib/client-alerts";
import { getAlertListingsForAutomation } from "@/lib/listings";
import { getAlertSenderProfile } from "@/lib/profiles";

export type ClientAlertRunResult = {
  clientId: string;
  clientEmail: string;
  frequency: string;
  ok: boolean;
  skipped: boolean;
  message: string;
  sentCount: number;
  matchCount: number;
};

const defaultBatchLimit = 5;
const maxBatchLimit = 10;

function getBatchLimit(value: unknown) {
  const parsed = Number(value ?? defaultBatchLimit);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return defaultBatchLimit;
  }

  return Math.min(parsed, maxBatchLimit);
}

function latestDate(values: Array<string | null>) {
  const timestamps = values
    .map((value) => (value ? new Date(value).getTime() : NaN))
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps));
}

function shouldRunForFrequency(client: AgentClient, now = new Date()) {
  if (client.alertFrequency === "Off") {
    return {
      due: false,
      reason: "Alert frequency is Off.",
    };
  }

  if (client.alertFrequency === "Immediate") {
    return {
      due: true,
      reason: "Immediate alerts are due when unsent matches exist.",
    };
  }

  const lastActivity = latestDate([
    client.alertLastCheckedAt,
    client.alertLastSentAt,
  ]);

  if (!lastActivity) {
    return {
      due: true,
      reason: "No previous alert check exists.",
    };
  }

  const elapsedMs = now.getTime() - lastActivity.getTime();
  const requiredMs =
    client.alertFrequency === "Weekly"
      ? 7 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

  return {
    due: elapsedMs >= requiredMs,
    reason:
      elapsedMs >= requiredMs
        ? `${client.alertFrequency} alert is due.`
        : `${client.alertFrequency} alert is not due yet.`,
  };
}

function getRunSecret() {
  return process.env.CLIENT_ALERT_RUN_SECRET?.trim() ?? "";
}

export function assertClientAlertRunSecret(secret: string | null) {
  const expectedSecret = getRunSecret();

  if (!expectedSecret) {
    throw new Error("CLIENT_ALERT_RUN_SECRET is not configured.");
  }

  if (!secret || secret !== expectedSecret) {
    throw new Error("Invalid client alert run secret.");
  }
}

async function getSender(
  ownerId: string,
  cache: Map<string, AlertSender | null>
) {
  if (!cache.has(ownerId)) {
    cache.set(ownerId, await getAlertSenderProfile(ownerId));
  }

  return cache.get(ownerId);
}

export async function runScheduledClientAlerts({
  dryRun = true,
  limit,
  siteUrl,
}: {
  dryRun?: boolean;
  limit?: unknown;
  siteUrl: string;
}) {
  const batchLimit = getBatchLimit(limit);
  const [clients, listings] = await Promise.all([
    getScheduledAlertClients(batchLimit),
    getAlertListingsForAutomation(),
  ]);
  const senderCache = new Map<string, AlertSender | null>();
  const results: ClientAlertRunResult[] = [];

  for (const client of clients) {
    const due = shouldRunForFrequency(client);

    if (!due.due) {
      results.push({
        clientId: client.id,
        clientEmail: client.email,
        frequency: client.alertFrequency,
        ok: true,
        skipped: true,
        message: due.reason,
        sentCount: 0,
        matchCount: 0,
      });
      continue;
    }

    const sender = await getSender(client.ownerId, senderCache);

    if (!sender) {
      results.push({
        clientId: client.id,
        clientEmail: client.email,
        frequency: client.alertFrequency,
        ok: false,
        skipped: true,
        message: "Listing alert owner profile was not found.",
        sentCount: 0,
        matchCount: 0,
      });
      continue;
    }

    const result = await sendScheduledListingAlert({
      client,
      dryRun,
      listings,
      sender,
      siteUrl,
    });

    results.push({
      clientId: client.id,
      clientEmail: client.email,
      frequency: client.alertFrequency,
      ok: result.ok,
      skipped: result.skipped,
      message: result.message,
      sentCount: result.sentCount,
      matchCount: result.matchCount,
    });
  }

  return {
    ok: results.every((result) => result.ok),
    dryRun,
    clientCount: clients.length,
    processedCount: results.length,
    sentCount: results.reduce((sum, result) => sum + result.sentCount, 0),
    matchCount: results.reduce((sum, result) => sum + result.matchCount, 0),
    results,
  };
}
