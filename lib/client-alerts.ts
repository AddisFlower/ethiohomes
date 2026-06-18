import { randomUUID } from "node:crypto";
import type { AgentSession } from "@/lib/auth";
import {
  type AgentClient,
  getClientAlertMatchDiagnostics,
  getAgentClientById,
  getClientListingMatches,
} from "@/lib/clients";
import type { Property } from "@/lib/listings";
import {
  authenticatedSupabaseRequest,
  serviceRoleSupabaseRequest,
} from "@/lib/supabase";

export type ClientAlertSendStatus = "Sent" | "Failed";

export type ClientAlertSend = {
  id: string;
  sendBatchId: string;
  agentClientId: string;
  agentOwnerId: string;
  listingId: string;
  listingTitle: string;
  listingMlsId: string;
  recipientEmail: string;
  status: ClientAlertSendStatus;
  resendEmailId: string | null;
  errorMessage: string | null;
  sentAt: string;
  createdAt: string;
};

type ClientAlertSendRow = {
  id: string;
  send_batch_id: string;
  agent_client_id: string;
  agent_owner_id: string;
  listing_id: string;
  listing_title: string;
  listing_mls_id: string;
  recipient_email: string;
  status: string;
  resend_email_id: string | null;
  error_message: string | null;
  sent_at: string;
  created_at: string;
};

type ResendEmailResponse = {
  id?: string;
  message?: string;
  name?: string;
  error?: unknown;
};

export type AlertSender = {
  email?: string | null;
  fullName?: string | null;
  agencyName?: string | null;
};

const maxListingsPerEmail = 5;
const manualRepeatGuardMs = 5 * 60 * 1000;
const resendEndpoint = "https://api.resend.com/emails";
const sendTimestamps: number[] = [];

function toClientAlertSend(row: ClientAlertSendRow): ClientAlertSend {
  return {
    id: row.id,
    sendBatchId: row.send_batch_id,
    agentClientId: row.agent_client_id,
    agentOwnerId: row.agent_owner_id,
    listingId: row.listing_id,
    listingTitle: row.listing_title,
    listingMlsId: row.listing_mls_id,
    recipientEmail: row.recipient_email,
    status: row.status === "Sent" ? "Sent" : "Failed",
    resendEmailId: row.resend_email_id,
    errorMessage: row.error_message,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getProductName() {
  return process.env.LISTING_ALERT_PRODUCT_NAME?.trim() || "EthioMLS";
}

function getSenderEmail() {
  const sender = process.env.LISTING_ALERT_FROM_EMAIL?.trim();

  if (!sender) {
    throw new Error("LISTING_ALERT_FROM_EMAIL is not configured.");
  }

  return sender;
}

function getResendApiKey() {
  const key = process.env.RESEND_API_KEY?.trim();

  if (!key) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  return key;
}

function getReplyToEmail(sender: AlertSender) {
  return (
    sender.email?.trim() ||
    process.env.LISTING_ALERT_REPLY_TO_EMAIL?.trim() ||
    undefined
  );
}

function getAgentName(sender: AlertSender) {
  return (
    sender.fullName?.trim() ||
    "Your agent"
  );
}

function getConfiguredRateLimit() {
  const value = Number(process.env.LISTING_ALERT_MAX_SENDS_PER_MINUTE ?? 60);
  return Number.isInteger(value) && value > 0 ? value : 60;
}

function assertWithinRateLimit(now = Date.now()) {
  const cutoff = now - 60_000;

  while (sendTimestamps.length > 0 && sendTimestamps[0] < cutoff) {
    sendTimestamps.shift();
  }

  if (sendTimestamps.length >= getConfiguredRateLimit()) {
    throw new Error("Listing alert send limit reached. Try again shortly.");
  }

  sendTimestamps.push(now);
}

function buildListingUrl(siteUrl: string, listing: Property) {
  return `${siteUrl.replace(/\/$/, "")}/listings/${encodeURIComponent(
    listing.id
  )}`;
}

function buildUnsubscribeUrl(siteUrl: string, client: AgentClient) {
  if (!client.alertUnsubscribeToken) {
    return null;
  }

  return `${siteUrl.replace(
    /\/$/,
    ""
  )}/alerts/unsubscribe?token=${encodeURIComponent(
    client.alertUnsubscribeToken
  )}`;
}

function buildSubject(client: AgentClient, listings: Property[]) {
  const location = client.preferredLocation?.trim();

  if (location) {
    return `${listings.length} listings that match your ${location} search`;
  }

  return "New listings that match your search";
}

function getRoomSummary(listing: Property) {
  const rooms = [
    listing.bedrooms === null ? null : `${listing.bedrooms} bed`,
    listing.bathrooms === null ? null : `${listing.bathrooms} bath`,
  ].filter(Boolean);

  return rooms.length > 0 ? rooms.join(", ") : "Room count not listed";
}

function buildEmailContent(
  client: AgentClient,
  listings: Property[],
  sender: AlertSender,
  siteUrl: string
) {
  const agentName = getAgentName(sender);
  const agencyName = sender.agencyName?.trim();
  const productName = getProductName();
  const unsubscribeUrl = buildUnsubscribeUrl(siteUrl, client);
  const listingLines = listings
    .map((listing, index) => {
      const url = buildListingUrl(siteUrl, listing);
      return `${index + 1}. ${listing.title}
${listing.price} - ${listing.location}
${listing.propertyType} / ${listing.transactionType} / ${listing.marketStatus}
${getRoomSummary(listing)}
View Details: ${url}`;
    })
    .join("\n\n");

  const htmlListings = listings
    .map((listing) => {
      const url = buildListingUrl(siteUrl, listing);
      return `<article style="border:1px solid #d1d5db;border-radius:8px;padding:16px;margin:16px 0;">
        ${
          listing.image
            ? `<img src="${escapeHtml(
                listing.image
              )}" alt="" style="width:100%;max-width:560px;border-radius:6px;margin-bottom:12px;" />`
            : ""
        }
        <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">${escapeHtml(
          listing.title
        )}</h2>
        <p style="margin:0 0 8px;color:#374151;">${escapeHtml(
          listing.price
        )} - ${escapeHtml(listing.location)}</p>
        <p style="margin:0 0 12px;color:#4b5563;">${escapeHtml(
          listing.propertyType
        )} / ${escapeHtml(listing.transactionType)} / ${escapeHtml(
          listing.marketStatus
        )} / ${escapeHtml(getRoomSummary(listing))}</p>
        <a href="${escapeHtml(
          url
        )}" style="display:inline-block;background:#047857;color:#ffffff;text-decoration:none;border-radius:6px;padding:10px 14px;font-weight:600;">View Details</a>
      </article>`;
    })
    .join("");

  const signature = agencyName
    ? `${agentName}, ${agencyName} via ${productName}`
    : `${agentName} via ${productName}`;

  return {
    subject: buildSubject(client, listings),
    text: `Hi ${client.name},

I found a few listings that match what you are looking for.

${listingLines}

${
      unsubscribeUrl
        ? `Manage or stop these listing updates: ${unsubscribeUrl}`
        : "Reply to this email if you no longer want listing updates from me."
    }

${signature}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;max-width:640px;">
      <p>Hi ${escapeHtml(client.name)},</p>
      <p>I found a few listings that match what you are looking for.</p>
      ${htmlListings}
      ${
        unsubscribeUrl
          ? `<p style="color:#4b5563;"><a href="${escapeHtml(
              unsubscribeUrl
            )}" style="color:#047857;">Manage or stop these listing updates</a>.</p>`
          : `<p style="color:#4b5563;">Reply to this email if you no longer want listing updates from me.</p>`
      }
      <p>${escapeHtml(signature)}</p>
    </div>`,
  };
}

async function sendResendEmail({
  client,
  listings,
  session,
  sender,
  siteUrl,
  batchId,
}: {
  client: AgentClient;
  listings: Property[];
  session?: AgentSession;
  sender?: AlertSender;
  siteUrl: string;
  batchId: string;
}) {
  assertWithinRateLimit();

  const alertSender = sender ?? {
    email: session?.user.email,
    fullName:
      session?.profile.full_name ??
      session?.user.userMetadata?.full_name ??
      session?.user.userMetadata?.name,
    agencyName: session?.profile.agency_name,
  };
  const agentName = getAgentName(alertSender);
  const { subject, html, text } = buildEmailContent(
    client,
    listings,
    alertSender,
    siteUrl
  );
  const response = await fetch(resendEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getResendApiKey()}`,
      "Content-Type": "application/json",
      "Idempotency-Key": batchId,
    },
    body: JSON.stringify({
      from: `${agentName} <${getSenderEmail()}>`,
      to: [client.email],
      reply_to: getReplyToEmail(alertSender),
      subject,
      html,
      text,
    }),
  });
  const body = (await response.json().catch(() => ({}))) as ResendEmailResponse;

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Resend rate or quota limit reached. Try again later.");
    }

    throw new Error(
      body.message || body.name || "Resend email delivery failed."
    );
  }

  if (!body.id) {
    throw new Error("Resend did not return an email ID.");
  }

  return body.id;
}

async function getSuccessfullySentListingIds(
  clientId: string,
  ownerId: string,
  accessToken: string
) {
  const rows = await authenticatedSupabaseRequest<
    Pick<ClientAlertSendRow, "listing_id">[]
  >(
    `/client_alert_sends?select=listing_id&agent_client_id=eq.${encodeURIComponent(
      clientId
    )}&agent_owner_id=eq.${encodeURIComponent(
      ownerId
    )}&status=eq.Sent`,
    accessToken
  );

  return rows.map((row) => row.listing_id);
}

async function getSuccessfullySentListingIdsWithServiceRole(
  clientId: string,
  ownerId: string
) {
  const rows = await serviceRoleSupabaseRequest<
    Pick<ClientAlertSendRow, "listing_id">[]
  >(
    `/client_alert_sends?select=listing_id&agent_client_id=eq.${encodeURIComponent(
      clientId
    )}&agent_owner_id=eq.${encodeURIComponent(
      ownerId
    )}&status=eq.Sent`
  );

  return rows.map((row) => row.listing_id);
}

export async function getSentAlertListingIdsByClient(
  ownerId: string,
  accessToken: string
) {
  const rows = await authenticatedSupabaseRequest<
    Pick<ClientAlertSendRow, "agent_client_id" | "listing_id">[]
  >(
    `/client_alert_sends?select=agent_client_id,listing_id&agent_owner_id=eq.${encodeURIComponent(
      ownerId
    )}&status=eq.Sent`,
    accessToken
  );
  const sentListingIdsByClient = new Map<string, string[]>();

  rows.forEach((row) => {
    const ids = sentListingIdsByClient.get(row.agent_client_id) ?? [];
    ids.push(row.listing_id);
    sentListingIdsByClient.set(row.agent_client_id, ids);
  });

  return sentListingIdsByClient;
}

async function getRecentSend(
  clientId: string,
  ownerId: string,
  accessToken: string
) {
  const cutoff = encodeURIComponent(
    new Date(Date.now() - manualRepeatGuardMs).toISOString()
  );
  const rows = await authenticatedSupabaseRequest<ClientAlertSendRow[]>(
    `/client_alert_sends?select=*&agent_client_id=eq.${encodeURIComponent(
      clientId
    )}&agent_owner_id=eq.${encodeURIComponent(
      ownerId
    )}&sent_at=gte.${cutoff}&order=sent_at.desc&limit=1`,
    accessToken
  );

  return rows[0] ? toClientAlertSend(rows[0]) : null;
}

async function updateAlertTimestamps(
  client: AgentClient,
  accessToken: string,
  checkedAt: string,
  sentAt?: string,
  matchedListingIds?: string[]
) {
  await authenticatedSupabaseRequest(
    `/agent_clients?id=eq.${encodeURIComponent(
      client.id
    )}&owner_id=eq.${encodeURIComponent(client.ownerId)}`,
    accessToken,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        alert_last_checked_at: checkedAt,
        ...(sentAt
          ? {
              alert_last_sent_at: sentAt,
              alert_matched_listing_ids: matchedListingIds ?? [],
            }
          : {}),
      }),
    }
  );
}

async function updateAlertTimestampsWithServiceRole(
  client: AgentClient,
  checkedAt: string,
  sentAt?: string,
  matchedListingIds?: string[]
) {
  await serviceRoleSupabaseRequest(
    `/agent_clients?id=eq.${encodeURIComponent(
      client.id
    )}&owner_id=eq.${encodeURIComponent(client.ownerId)}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        alert_last_checked_at: checkedAt,
        ...(sentAt
          ? {
              alert_last_sent_at: sentAt,
              alert_matched_listing_ids: matchedListingIds ?? [],
            }
          : {}),
      }),
    }
  );
}

async function recordAlertSendRows({
  client,
  listings,
  ownerId,
  accessToken,
  batchId,
  status,
  resendEmailId = null,
  errorMessage = null,
  sentAt,
}: {
  client: AgentClient;
  listings: Property[];
  ownerId: string;
  accessToken: string;
  batchId: string;
  status: ClientAlertSendStatus;
  resendEmailId?: string | null;
  errorMessage?: string | null;
  sentAt: string;
}) {
  const rows = listings.map((listing) => ({
    id: randomUUID(),
    send_batch_id: batchId,
    agent_client_id: client.id,
    agent_owner_id: ownerId,
    listing_id: listing.id,
    listing_title: listing.title,
    listing_mls_id: listing.listingId,
    recipient_email: client.email,
    status,
    resend_email_id: resendEmailId,
    error_message: errorMessage?.slice(0, 300) ?? null,
    sent_at: sentAt,
  }));

  return authenticatedSupabaseRequest<ClientAlertSendRow[]>(
    "/client_alert_sends",
    accessToken,
    {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(rows),
    }
  );
}

async function recordAlertSendRowsWithServiceRole({
  client,
  listings,
  ownerId,
  batchId,
  status,
  resendEmailId = null,
  errorMessage = null,
  sentAt,
}: {
  client: AgentClient;
  listings: Property[];
  ownerId: string;
  batchId: string;
  status: ClientAlertSendStatus;
  resendEmailId?: string | null;
  errorMessage?: string | null;
  sentAt: string;
}) {
  const rows = listings.map((listing) => ({
    id: randomUUID(),
    send_batch_id: batchId,
    agent_client_id: client.id,
    agent_owner_id: ownerId,
    listing_id: listing.id,
    listing_title: listing.title,
    listing_mls_id: listing.listingId,
    recipient_email: client.email,
    status,
    resend_email_id: resendEmailId,
    error_message: errorMessage?.slice(0, 300) ?? null,
    sent_at: sentAt,
  }));

  return serviceRoleSupabaseRequest<ClientAlertSendRow[]>(
    "/client_alert_sends",
    {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(rows),
    }
  );
}

export async function getClientAlertHistory(
  ownerId: string,
  accessToken: string,
  clientId?: string
) {
  const clientFilter = clientId
    ? `&agent_client_id=eq.${encodeURIComponent(clientId)}`
    : "";
  const rows = await authenticatedSupabaseRequest<ClientAlertSendRow[]>(
    `/client_alert_sends?select=*&agent_owner_id=eq.${encodeURIComponent(
      ownerId
    )}${clientFilter}&order=sent_at.desc&limit=50`,
    accessToken
  );

  return rows.map(toClientAlertSend);
}

export async function sendListingAlertNow({
  clientId,
  includePreviouslySent = false,
  listings,
  previewListingIds,
  session,
  siteUrl,
}: {
  clientId: string;
  includePreviouslySent?: boolean;
  listings: Property[];
  previewListingIds?: string[];
  session: AgentSession;
  siteUrl: string;
}) {
  const checkedAt = new Date().toISOString();
  const client = await getAgentClientById(
    clientId,
    session.user.id,
    session.accessToken
  );

  if (!client) {
    return {
      ok: false,
      status: 404,
      message: "Client not found or access denied.",
      sentCount: 0,
    };
  }

  if (!client.email) {
    await updateAlertTimestamps(client, session.accessToken, checkedAt);
    return {
      ok: false,
      status: 400,
      message: "Client email is required before sending an alert.",
      sentCount: 0,
    };
  }

  if (client.alertUnsubscribedAt) {
    await updateAlertTimestamps(client, session.accessToken, checkedAt);
    return {
      ok: false,
      status: 409,
      message:
        "This client has unsubscribed from listing alerts. Re-enable alerts on the client record before sending.",
      sentCount: 0,
    };
  }

  const recentSend = await getRecentSend(
    client.id,
    session.user.id,
    session.accessToken
  );

  if (recentSend) {
    return {
      ok: false,
      status: 429,
      message: "Wait at least 5 minutes before sending this client another alert.",
      sentCount: 0,
    };
  }

  const previewListingIdSet =
    previewListingIds && previewListingIds.length > 0
      ? new Set(previewListingIds)
      : null;
  const scopedListings = previewListingIdSet
    ? listings.filter((listing) => previewListingIdSet.has(listing.id))
    : listings;
  const eligibleMatches = getClientListingMatches(client, scopedListings, {
    alertOnly: true,
    limit: maxListingsPerEmail,
  });
  const previouslySentListingIds = includePreviouslySent
    ? []
    : await getSuccessfullySentListingIds(
        client.id,
        session.user.id,
        session.accessToken
      );
  const matches = includePreviouslySent
    ? eligibleMatches
    : getClientListingMatches(client, scopedListings, {
        alertOnly: true,
        excludeListingIds: previouslySentListingIds,
        limit: maxListingsPerEmail,
      });

  if (matches.length === 0) {
    await updateAlertTimestamps(client, session.accessToken, checkedAt);
    const alertDiagnostics = getClientAlertMatchDiagnostics(
      client,
      scopedListings,
      previouslySentListingIds
    );
    const diagnostics = {
      previewListingCount: previewListingIds?.length ?? null,
      serverVisibleListingCount: listings.length,
      scopedListingCount: scopedListings.length,
      eligibleMatchCount: eligibleMatches.length,
      previouslySentCount: previouslySentListingIds.length,
      approvedListingCount: alertDiagnostics.approvedListingCount,
      alertMarketListingCount: alertDiagnostics.alertMarketListingCount,
      unsentMatchCount: alertDiagnostics.unsentMatchCount,
    };

    if (previewListingIdSet && scopedListings.length === 0) {
      return {
        ok: true,
        status: 200,
        message:
          "The previewed listing is no longer visible to this session. Refresh alerts and try again.",
        sentCount: 0,
        diagnostics,
      };
    }

    return {
      ok: true,
      status: 200,
      message:
        eligibleMatches.length > 0
          ? "All matching listings were already sent to this client. Use Resend matches to send them again."
          : "No matching listings found.",
      sentCount: 0,
      diagnostics,
    };
  }

  const batchId = randomUUID();

  try {
    const resendEmailId = await sendResendEmail({
      client,
      listings: matches,
      session,
      siteUrl,
      batchId,
    });
    const sentAt = new Date().toISOString();
    const rows = await recordAlertSendRows({
      client,
      listings: matches,
      ownerId: session.user.id,
      accessToken: session.accessToken,
      batchId,
      status: "Sent",
      resendEmailId,
      sentAt,
    });

    await updateAlertTimestamps(
      client,
      session.accessToken,
      checkedAt,
      sentAt,
      matches.map((listing) => listing.id)
    );

    return {
      ok: true,
      status: 200,
      message: `Sent ${matches.length} listing${
        matches.length === 1 ? "" : "s"
      } to ${client.email}.`,
      sentCount: matches.length,
      history: rows.map(toClientAlertSend),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Listing alert email failed.";
    const failedAt = new Date().toISOString();
    const rows = await recordAlertSendRows({
      client,
      listings: matches,
      ownerId: session.user.id,
      accessToken: session.accessToken,
      batchId,
      status: "Failed",
      errorMessage: message,
      sentAt: failedAt,
    });

    await updateAlertTimestamps(client, session.accessToken, checkedAt);

    return {
      ok: false,
      status: message.includes("limit") ? 429 : 502,
      message,
      sentCount: 0,
      history: rows.map(toClientAlertSend),
    };
  }
}

export async function sendScheduledListingAlert({
  client,
  dryRun = true,
  listings,
  sender,
  siteUrl,
}: {
  client: AgentClient;
  dryRun?: boolean;
  listings: Property[];
  sender: AlertSender;
  siteUrl: string;
}) {
  const checkedAt = new Date().toISOString();

  if (!client.alertEnabled || !client.alertConsentAt) {
    return {
      ok: true,
      status: 200,
      message: "Client is not enabled for scheduled alerts.",
      sentCount: 0,
      matchCount: 0,
      skipped: true,
    };
  }

  if (!client.email) {
    if (!dryRun) {
      await updateAlertTimestampsWithServiceRole(client, checkedAt);
    }

    return {
      ok: false,
      status: 400,
      message: "Client email is required before sending an alert.",
      sentCount: 0,
      matchCount: 0,
      skipped: true,
    };
  }

  if (client.alertUnsubscribedAt) {
    if (!dryRun) {
      await updateAlertTimestampsWithServiceRole(client, checkedAt);
    }

    return {
      ok: false,
      status: 409,
      message:
        "This client has unsubscribed from listing alerts. Re-enable alerts on the client record before sending.",
      sentCount: 0,
      matchCount: 0,
      skipped: true,
    };
  }

  const previouslySentListingIds =
    await getSuccessfullySentListingIdsWithServiceRole(
      client.id,
      client.ownerId
    );
  const matches = getClientListingMatches(client, listings, {
    alertOnly: true,
    excludeListingIds: previouslySentListingIds,
    limit: maxListingsPerEmail,
  });

  if (matches.length === 0) {
    if (!dryRun) {
      await updateAlertTimestampsWithServiceRole(client, checkedAt);
    }

    return {
      ok: true,
      status: 200,
      message: "No new matching listings found.",
      sentCount: 0,
      matchCount: 0,
      skipped: true,
    };
  }

  if (dryRun) {
    return {
      ok: true,
      status: 200,
      message: `Dry run found ${matches.length} matching listing${
        matches.length === 1 ? "" : "s"
      }.`,
      sentCount: 0,
      matchCount: matches.length,
      skipped: false,
      listingIds: matches.map((listing) => listing.id),
    };
  }

  const batchId = randomUUID();

  try {
    const resendEmailId = await sendResendEmail({
      client,
      listings: matches,
      sender,
      siteUrl,
      batchId,
    });
    const sentAt = new Date().toISOString();
    const rows = await recordAlertSendRowsWithServiceRole({
      client,
      listings: matches,
      ownerId: client.ownerId,
      batchId,
      status: "Sent",
      resendEmailId,
      sentAt,
    });

    await updateAlertTimestampsWithServiceRole(
      client,
      checkedAt,
      sentAt,
      matches.map((listing) => listing.id)
    );

    return {
      ok: true,
      status: 200,
      message: `Sent ${matches.length} listing${
        matches.length === 1 ? "" : "s"
      } to ${client.email}.`,
      sentCount: matches.length,
      matchCount: matches.length,
      skipped: false,
      history: rows.map(toClientAlertSend),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Listing alert email failed.";
    const failedAt = new Date().toISOString();
    const rows = await recordAlertSendRowsWithServiceRole({
      client,
      listings: matches,
      ownerId: client.ownerId,
      batchId,
      status: "Failed",
      errorMessage: message,
      sentAt: failedAt,
    });

    await updateAlertTimestampsWithServiceRole(client, checkedAt);

    return {
      ok: false,
      status: message.includes("limit") ? 429 : 502,
      message,
      sentCount: 0,
      matchCount: matches.length,
      skipped: false,
      history: rows.map(toClientAlertSend),
    };
  }
}
