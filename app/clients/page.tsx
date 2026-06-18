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

function formatCriteriaSummary(client: {
  preferredLocation: string | null;
  preferredPropertyType: string | null;
  preferredTransactionType: string | null;
  minPrice: number | null;
  maxPrice: number | null;
}) {
  const parts = [
    client.preferredLocation,
    client.preferredPropertyType,
    client.preferredTransactionType,
  ].filter(Boolean);
  const budget =
    client.minPrice !== null || client.maxPrice !== null
      ? `${client.minPrice?.toLocaleString("en-US") ?? "0"} - ${
          client.maxPrice?.toLocaleString("en-US") ?? "Any"
        } ETB`
      : null;

  return [...parts, budget].filter(Boolean).join(" / ") || "No criteria saved";
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
  const unsubscribedCount = clients.filter(
    (client) => client.alertUnsubscribedAt
  ).length;
  const followUpCount = dueFollowUps.length;
  const activeClients = clients.filter(
    (client) => client.status !== "Closed" && client.status !== "Not Interested"
  ).length;

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Agent CRM
            </p>
            <h1 className="mt-2 text-3xl font-bold text-black">Clients</h1>
            <p className="mt-2 max-w-3xl text-gray-600">
              Manage buyer and renter contacts, follow-ups, saved criteria, and
              listing alerts from one workspace.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/clients/alerts"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 transition hover:border-emerald-700 hover:text-emerald-700"
            >
              Alert Workspace
            </Link>
            <Link
              href="/clients/new"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800"
            >
              Add Client
            </Link>
          </div>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
          {[
            ["Total Clients", clients.length],
            ["Active Pipeline", activeClients],
            ["Due Follow-ups", followUpCount],
            ["Alerts Enabled", alertCount],
            ["Unsubscribed", unsubscribedCount],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-2 text-3xl font-bold text-black">{value}</p>
            </div>
          ))}
        </section>

        {clients.length === 0 ? (
          <section className="rounded-lg border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h2 className="mb-3 text-2xl font-bold text-black">
              No clients yet
            </h2>
            <p className="mb-6 text-gray-600">
              Add a contact to begin tracking outreach and saved listing
              criteria.
            </p>
            <Link
              href="/clients/new"
              className="inline-flex rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800"
            >
              Add Client
            </Link>
          </section>
        ) : (
          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="font-bold text-black">Client List</h2>
            </div>
            <div className="hidden grid-cols-[1.2fr_0.8fr_1.4fr_0.9fr_0.8fr] gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-600 lg:grid">
              <p>Client</p>
              <p>Status</p>
              <p>Saved Criteria</p>
              <p>Next Follow-up</p>
              <p>Alerts</p>
            </div>
            <div className="divide-y divide-gray-200">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="grid gap-4 px-5 py-4 transition hover:bg-gray-50 lg:grid-cols-[1.2fr_0.8fr_1.4fr_0.9fr_0.8fr] lg:items-center"
                >
                  <div>
                    <p className="font-semibold text-black">{client.name}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {client.email}
                    </p>
                    {client.phone && (
                      <p className="mt-1 text-sm text-gray-500">
                        {client.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                      {client.status}
                    </span>
                    <p className="mt-2 text-sm text-gray-500">
                      {client.source}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700">
                    {formatCriteriaSummary(client)}
                  </p>
                  <p className="text-sm text-gray-700">
                    {formatDate(client.nextFollowUpAt)}
                  </p>
                  <div>
                    <span
                      className={
                        client.alertUnsubscribedAt
                          ? "inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700"
                          : client.alertEnabled
                          ? "inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700"
                          : "inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600"
                      }
                    >
                      {client.alertUnsubscribedAt
                        ? "Unsubscribed"
                        : client.alertEnabled
                          ? "Enabled"
                          : "Off"}
                    </span>
                    <p className="mt-2 text-sm text-gray-500">
                      {client.alertMarketStatuses.join(", ")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
