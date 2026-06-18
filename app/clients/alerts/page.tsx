import Link from "next/link";
import { redirect } from "next/navigation";
import {
  canUseAgentFeatures,
  getAppSession,
  isAuthenticated,
} from "@/lib/auth";
import {
  getAgentClients,
  getClientAlertExclusionReasons,
  getClientAlertMatchDiagnostics,
  getClientListingMatches,
} from "@/lib/clients";
import {
  getClientAlertHistory,
  getSentAlertListingIdsByClient,
} from "@/lib/client-alerts";
import type { Property } from "@/lib/listings";
import { getListingsForViewer } from "@/lib/listings";
import AgentProfileRequired from "@/components/AgentProfileRequired";
import AlertSendButton from "./AlertSendButton";

function formatDate(value: string | null) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function ListingRow({
  listing,
  note,
}: {
  listing: Property;
  note?: string;
}) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="grid gap-2 border-t border-gray-200 py-3 text-sm transition hover:bg-gray-50 md:grid-cols-[1.4fr_0.9fr_0.8fr]"
    >
      <div>
        <p className="font-semibold text-black">{listing.title}</p>
        <p className="text-gray-600">{listing.location}</p>
      </div>
      <p className="text-gray-700">{listing.price}</p>
      <div>
        <p className="font-medium text-gray-800">{listing.marketStatus}</p>
        {note && <p className="text-gray-500">{note}</p>}
      </div>
    </Link>
  );
}

export default async function ClientAlertsPage() {
  const session = await getAppSession();

  if (session.role === "public") {
    redirect("/login");
  }

  if (!canUseAgentFeatures(session)) {
    return <AgentProfileRequired />;
  }

  const [clients, listings, history, sentListingIdsByClient] =
    await Promise.all([
      getAgentClients(session.user.id, session.accessToken),
      getListingsForViewer(
        session.role,
        session.user.id,
        isAuthenticated(session) ? session.accessToken : undefined
      ),
      getClientAlertHistory(session.user.id, session.accessToken),
      getSentAlertListingIdsByClient(session.user.id, session.accessToken),
    ]);

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/clients"
              className="mb-4 inline-flex font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Back to Clients
            </Link>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Listing Alerts
            </p>
            <h1 className="mt-2 text-3xl font-bold text-black">
              Client Alert Workspace
            </h1>
            <p className="mt-2 max-w-3xl text-gray-600">
              Review email-ready matches, understand excluded listings, and
              send manual listing alerts.
            </p>
          </div>
          <Link
            href="/clients/new"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800"
          >
            Add Client
          </Link>
        </div>

        {clients.length === 0 ? (
          <section className="rounded-lg bg-white p-8 text-center shadow-sm">
            <h2 className="mb-3 text-2xl font-bold text-black">
              No client alerts yet
            </h2>
            <p className="text-gray-600">
              Add a client record with saved criteria to prepare listing
              alerts.
            </p>
          </section>
        ) : (
          <div className="space-y-6">
            {clients.map((client) => {
              const previouslySentIds =
                sentListingIdsByClient.get(client.id) ?? [];
              const diagnostics = getClientAlertMatchDiagnostics(
                client,
                listings,
                previouslySentIds
              );
              const sendableMatches = getClientListingMatches(
                client,
                listings,
                {
                  alertOnly: true,
                  excludeListingIds: previouslySentIds,
                  limit: 5,
                }
              );
              const eligibleMatches = getClientListingMatches(client, listings, {
                alertOnly: true,
                limit: 5,
              });
              const alreadySentMatches = eligibleMatches.filter((listing) =>
                previouslySentIds.includes(listing.id)
              );
              const excludedListings = listings
                .map((listing) => ({
                  listing,
                  reasons: getClientAlertExclusionReasons(
                    client,
                    listing,
                    previouslySentIds
                  ),
                }))
                .filter((item) => item.reasons.length > 0)
                .slice(0, 5);
              const latestHistory = history.find(
                (send) => send.agentClientId === client.id
              );

              return (
                <section
                  key={client.id}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                >
                  <div className="border-b border-gray-200 bg-white p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="mb-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                            {client.alertEnabled ? "Enabled" : "Disabled"}
                          </span>
                          {client.alertUnsubscribedAt && (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                              Unsubscribed
                            </span>
                          )}
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            {client.alertFrequency}
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-black">
                          {client.name}
                        </h2>
                        <p className="mt-1 text-gray-600">{client.email}</p>
                        <p className="mt-2 text-sm text-gray-500">
                          Alert markets: {client.alertMarketStatuses.join(", ")}
                        </p>
                        {client.alertUnsubscribedAt && (
                          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                            <p className="font-semibold">
                              Client unsubscribed from listing alerts.
                            </p>
                            <p className="mt-1">
                              Alerts were turned off on{" "}
                              {formatDate(client.alertUnsubscribedAt)}.
                              Re-enable alerts from the client edit page only
                              with the client&apos;s consent.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="w-full lg:w-64">
                        <AlertSendButton
                          clientId={client.id}
                          hasAlreadySentMatches={eligibleMatches.length > 0}
                          previewListingIds={sendableMatches.map(
                            (listing) => listing.id
                          )}
                          resendListingIds={eligibleMatches.map(
                            (listing) => listing.id
                          )}
                        />
                        <Link
                          href={`/clients/${client.id}`}
                          className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:border-emerald-700 hover:text-emerald-700"
                        >
                          View client
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-px bg-gray-200 text-sm md:grid-cols-5">
                    {[
                      ["Approved Listings", diagnostics.approvedListingCount],
                      ["In Alert Markets", diagnostics.alertMarketListingCount],
                      ["Criteria Matches", diagnostics.eligibleMatchCount],
                      ["New Matches", diagnostics.unsentMatchCount],
                      ["Sent Before", diagnostics.previouslySentCount],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-gray-50 p-4">
                        <p className="text-gray-500">{label}</p>
                        <p className="mt-1 text-2xl font-bold text-black">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-6 p-5 lg:grid-cols-[1fr_1fr]">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold text-black">
                          Ready to Send
                        </h3>
                        <span className="text-sm text-gray-500">
                          {sendableMatches.length} listings
                        </span>
                      </div>
                      {sendableMatches.length > 0 ? (
                        <div>
                          {sendableMatches.map((listing) => (
                            <ListingRow
                              key={listing.id}
                              listing={listing}
                              note="Not sent yet"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-900">
                          <p className="font-semibold">
                            No new listings are ready to send.
                          </p>
                          <p className="mt-1">
                            If eligible listings were already emailed, use
                            Resend matches.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold text-black">
                          Already Sent
                        </h3>
                        <span className="text-sm text-gray-500">
                          {alreadySentMatches.length} listings
                        </span>
                      </div>
                      {alreadySentMatches.length > 0 ? (
                        <div>
                          {alreadySentMatches.map((listing) => (
                            <ListingRow
                              key={listing.id}
                              listing={listing}
                              note="Eligible for resend"
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                          No eligible listings have been sent to this client.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 bg-gray-50 p-5">
                    <details className="rounded-lg border border-gray-200 bg-white p-4">
                      <summary className="cursor-pointer font-bold text-black">
                        Excluded listings and reasons
                      </summary>
                      <div className="mt-4 divide-y divide-gray-200">
                        {excludedListings.length > 0 ? (
                          excludedListings.map(({ listing, reasons }) => (
                            <div
                              key={listing.id}
                              className="grid gap-2 py-3 text-sm md:grid-cols-[1fr_1.2fr]"
                            >
                              <div>
                                <p className="font-semibold text-black">
                                  {listing.title}
                                </p>
                                <p className="text-gray-600">
                                  {listing.price} - {listing.location}
                                </p>
                              </div>
                              <p className="text-gray-600">
                                {reasons.join("; ")}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-600">
                            No excluded listings to show.
                          </p>
                        )}
                      </div>
                    </details>

                    {latestHistory && (
                      <div className="mt-5 rounded-lg bg-gray-50 p-4 text-sm">
                        <p className="font-semibold text-black">
                          Last result: {latestHistory.status}
                        </p>
                        <p className="mt-1 text-gray-600">
                          {latestHistory.listingTitle} /{" "}
                          {formatDate(latestHistory.sentAt)}
                        </p>
                        {latestHistory.errorMessage && (
                          <p className="mt-1 text-red-700">
                            {latestHistory.errorMessage}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {history.length > 0 && (
          <section className="mt-8 rounded-lg bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-black">Recent History</h2>
            <div className="mt-4 divide-y divide-gray-200">
              {history.slice(0, 12).map((send) => (
                <div
                  key={send.id}
                  className="grid gap-2 py-4 text-sm md:grid-cols-[1fr_120px_180px]"
                >
                  <div>
                    <p className="font-semibold text-black">
                      {send.listingTitle}
                    </p>
                    <p className="text-gray-600">{send.recipientEmail}</p>
                    {send.errorMessage && (
                      <p className="mt-1 text-red-700">{send.errorMessage}</p>
                    )}
                  </div>
                  <p
                    className={
                      send.status === "Sent"
                        ? "font-semibold text-emerald-700"
                        : "font-semibold text-red-700"
                    }
                  >
                    {send.status}
                  </p>
                  <p className="text-gray-600">{formatDate(send.sentAt)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
