import Link from "next/link";
import { redirect } from "next/navigation";
import {
  canUseAgentFeatures,
  getAppSession,
  isAuthenticated,
} from "@/lib/auth";
import {
  getAgentClients,
  getClientListingMatches,
} from "@/lib/clients";
import { getClientAlertHistory } from "@/lib/client-alerts";
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

export default async function ClientAlertsPage() {
  const session = await getAppSession();

  if (session.role === "public") {
    redirect("/login");
  }

  if (!canUseAgentFeatures(session)) {
    return <AgentProfileRequired />;
  }

  const [clients, listings, history] = await Promise.all([
    getAgentClients(session.user.id, session.accessToken),
    getListingsForViewer(
      session.role,
      session.user.id,
      isAuthenticated(session) ? session.accessToken : undefined
    ),
    getClientAlertHistory(session.user.id, session.accessToken),
  ]);
  const sentListingIdsByClient = new Map<string, string[]>();

  history
    .filter((send) => send.status === "Sent")
    .forEach((send) => {
      const ids = sentListingIdsByClient.get(send.agentClientId) ?? [];
      ids.push(send.listingId);
      sentListingIdsByClient.set(send.agentClientId, ids);
    });

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/clients"
          className="mb-5 inline-flex font-semibold text-emerald-700 hover:text-emerald-800"
        >
          Back to Clients
        </Link>

        <h1 className="text-4xl font-bold text-black">Automated Alerts</h1>
        <p className="mt-2 text-gray-600">
          Preview saved criteria, send listing matches manually, and review
          alert history.
        </p>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-900">
          <p className="font-semibold">Manual sending is enabled.</p>
          <p className="mt-1 text-sm">
            Scheduled automation remains deferred. Send now respects owner
            scoping, selected alert market statuses, previous successful sends,
            and the five-minute repeat guard.
          </p>
        </div>

        <div className="mt-8 grid gap-5">
          {clients.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow-md">
              <h2 className="mb-3 text-2xl font-bold text-black">
                No saved alerts
              </h2>
              <p className="text-gray-600">
                Add a client record to prepare listing alerts.
              </p>
            </div>
          ) : (
            clients.map((client) => {
              const previouslySentIds =
                sentListingIdsByClient.get(client.id) ?? [];
              const matches = getClientListingMatches(client, listings, {
                alertOnly: true,
                excludeListingIds: previouslySentIds,
                limit: 5,
              });
              const latestHistory = history.find(
                (send) => send.agentClientId === client.id
              );

              return (
                <div
                  key={client.id}
                  className="rounded-xl bg-white p-6 shadow-md"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-700">
                        {client.alertEnabled ? "Enabled" : "Disabled"} /{" "}
                        {client.alertFrequency}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-black">
                        {client.name}
                      </h2>
                      <p className="mt-1 text-gray-600">{client.email}</p>
                      <p className="mt-2 text-sm text-gray-500">
                        Alert markets: {client.alertMarketStatuses.join(", ")}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Last sent: {formatDate(client.alertLastSentAt)}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Last checked: {formatDate(client.alertLastCheckedAt)}
                      </p>
                    </div>

                    <div className="w-full space-y-3 md:w-56">
                      <div className="rounded-lg bg-blue-50 p-4 text-sm">
                        <p className="text-blue-700">Unsent matches</p>
                        <p className="text-3xl font-bold text-blue-800">
                          {matches.length}
                        </p>
                      </div>
                      <AlertSendButton clientId={client.id} />
                      <Link
                        href={`/clients/${client.id}`}
                        className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:border-emerald-700 hover:text-emerald-700"
                      >
                        View client
                      </Link>
                    </div>
                  </div>

                  {matches.length > 0 && (
                    <div className="mt-5 grid gap-3">
                      {matches.map((listing) => (
                        <Link
                          key={listing.id}
                          href={`/listings/${listing.id}`}
                          className="rounded-lg border border-gray-200 p-4 transition hover:border-emerald-700"
                        >
                          <p className="font-bold text-black">
                            {listing.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            {listing.price} - {listing.location}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {listing.transactionType} / {listing.marketStatus}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}

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
              );
            })
          )}
        </div>

        {history.length > 0 && (
          <section className="mt-10 rounded-xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-black">Recent History</h2>
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
