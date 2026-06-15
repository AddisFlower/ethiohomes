import Link from "next/link";
import { redirect } from "next/navigation";
import { canUseAgentFeatures, getAppSession } from "@/lib/auth";
import { getAgentClients, getDueFollowUps } from "@/lib/clients";
import AgentProfileRequired from "@/components/AgentProfileRequired";

function formatDate(value: string | null) {
  if (!value) {
    return "No follow-up set";
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

export default async function ClientsPage() {
  const session = await getAppSession();

  if (session.role === "public") {
    redirect("/login");
  }

  if (!canUseAgentFeatures(session)) {
    return <AgentProfileRequired />;
  }

  const [clients, dueFollowUps] = await Promise.all([
    getAgentClients(session.user.id, session.accessToken),
    getDueFollowUps(session.user.id, session.accessToken),
  ]);
  const alertCount = clients.filter((client) => client.alertEnabled).length;
  const followUpCount = dueFollowUps.length;

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-black">Clients</h1>
            <p className="mt-2 text-gray-600">
              Track client outreach, follow-ups, saved criteria, and alert
              preparation.
            </p>
          </div>

          <Link
            href="/clients/new"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800"
          >
            Add Client
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="/clients"
            className="rounded-xl border-l-4 border-emerald-700 bg-white p-5 shadow-md"
          >
            <p className="text-3xl font-bold text-emerald-700">
              {clients.length}
            </p>
            <p className="mt-1 font-semibold text-black">Client Records</p>
          </Link>

          <Link
            href="/clients/follow-ups"
            className="rounded-xl border-l-4 border-yellow-500 bg-white p-5 shadow-md"
          >
            <p className="text-3xl font-bold text-yellow-600">
              {followUpCount}
            </p>
            <p className="mt-1 font-semibold text-black">Due Follow-ups</p>
          </Link>

          <Link
            href="/clients/alerts"
            className="rounded-xl border-l-4 border-blue-600 bg-white p-5 shadow-md"
          >
            <p className="text-3xl font-bold text-blue-600">{alertCount}</p>
            <p className="mt-1 font-semibold text-black">Saved Alerts</p>
          </Link>
        </div>

        {clients.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-md">
            <h2 className="mb-3 text-2xl font-bold text-black">
              No clients yet
            </h2>
            <p className="mb-6 text-gray-600">
              Add a contact to begin tracking outreach and saved criteria.
            </p>
            <Link
              href="/clients/new"
              className="inline-flex rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800"
            >
              Add Client
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="block rounded-xl bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                        {client.status}
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                        {client.source}
                      </span>
                      {client.alertEnabled && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                          Alert Saved
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-bold text-black">
                      {client.name}
                    </h2>
                    <p className="mt-1 text-gray-600">{client.email}</p>
                    {client.phone && (
                      <p className="mt-1 text-gray-600">{client.phone}</p>
                    )}
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4 text-sm">
                    <p className="text-gray-500">Next follow-up</p>
                    <p className="font-semibold text-black">
                      {formatDate(client.nextFollowUpAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
