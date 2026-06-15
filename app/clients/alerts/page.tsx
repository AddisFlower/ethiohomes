import Link from "next/link";
import { redirect } from "next/navigation";
import {
  canUseAgentFeatures,
  getAppSession,
  isAuthenticated,
} from "@/lib/auth";
import {
  getAlertEnabledClients,
  getClientListingMatches,
} from "@/lib/clients";
import { getListingsForViewer } from "@/lib/listings";
import AgentProfileRequired from "@/components/AgentProfileRequired";

export default async function ClientAlertsPage() {
  const session = await getAppSession();

  if (session.role === "public") {
    redirect("/login");
  }

  if (!canUseAgentFeatures(session)) {
    return <AgentProfileRequired />;
  }

  const [clients, listings] = await Promise.all([
    getAlertEnabledClients(session.user.id, session.accessToken),
    getListingsForViewer(
      session.role,
      session.user.id,
      isAuthenticated(session) ? session.accessToken : undefined
    ),
  ]);

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
          Saved criteria ready for email alert automation.
        </p>

        <div className="mt-6 rounded-xl border border-yellow-300 bg-yellow-50 p-5 text-yellow-900">
          <p className="font-semibold">Email sending is not enabled yet.</p>
          <p className="mt-1 text-sm">
            These records prepare saved criteria and matching previews. Actual
            outbound email needs provider setup, consent, unsubscribe handling,
            duplicate suppression, and rate limits.
          </p>
        </div>

        <div className="mt-8 grid gap-5">
          {clients.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow-md">
              <h2 className="mb-3 text-2xl font-bold text-black">
                No saved alerts
              </h2>
              <p className="text-gray-600">
                Enable alert criteria on a client record to see it here.
              </p>
            </div>
          ) : (
            clients.map((client) => {
              const matches = getClientListingMatches(client, listings);

              return (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="block rounded-xl bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-700">
                        {client.alertFrequency} alert
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-black">
                        {client.name}
                      </h2>
                      <p className="mt-1 text-gray-600">{client.email}</p>
                    </div>

                    <div className="rounded-lg bg-blue-50 p-4 text-sm">
                      <p className="text-blue-700">Current matches</p>
                      <p className="text-3xl font-bold text-blue-800">
                        {matches.length}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
