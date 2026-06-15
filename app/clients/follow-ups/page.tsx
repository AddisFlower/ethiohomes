import Link from "next/link";
import { redirect } from "next/navigation";
import { canUseAgentFeatures, getAppSession } from "@/lib/auth";
import { getDueFollowUps } from "@/lib/clients";
import AgentProfileRequired from "@/components/AgentProfileRequired";

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
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

export default async function ClientFollowUpsPage() {
  const session = await getAppSession();

  if (session.role === "public") {
    redirect("/login");
  }

  if (!canUseAgentFeatures(session)) {
    return <AgentProfileRequired />;
  }

  const clients = await getDueFollowUps(session.user.id, session.accessToken);

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/clients"
          className="mb-5 inline-flex font-semibold text-emerald-700 hover:text-emerald-800"
        >
          Back to Clients
        </Link>

        <h1 className="text-4xl font-bold text-black">Follow-ups</h1>
        <p className="mt-2 text-gray-600">
          Clients with due or overdue follow-up dates.
        </p>

        <div className="mt-8 grid gap-5">
          {clients.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow-md">
              <h2 className="mb-3 text-2xl font-bold text-black">
                No due follow-ups
              </h2>
              <p className="text-gray-600">
                Clients with due follow-up dates will appear here.
              </p>
            </div>
          ) : (
            clients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="block rounded-xl bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
              >
                <p className="text-sm font-semibold text-yellow-700">
                  Due {formatDate(client.nextFollowUpAt)}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-black">
                  {client.name}
                </h2>
                <p className="mt-1 text-gray-600">{client.email}</p>
                <p className="mt-2 text-sm text-gray-500">{client.status}</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
