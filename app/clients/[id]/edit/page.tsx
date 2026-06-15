import Link from "next/link";
import { redirect } from "next/navigation";
import { canUseAgentFeatures, getAppSession } from "@/lib/auth";
import { getAgentClientById } from "@/lib/clients";
import AgentProfileRequired from "@/components/AgentProfileRequired";
import ClientForm from "../../ClientForm";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAppSession();

  if (session.role === "public") {
    redirect("/login");
  }

  if (!canUseAgentFeatures(session)) {
    return <AgentProfileRequired />;
  }

  const { id } = await params;
  const client = await getAgentClientById(
    id,
    session.user.id,
    session.accessToken
  );

  if (!client) {
    return (
      <main className="min-h-screen bg-gray-100 py-12 px-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="mb-4 text-4xl font-bold text-black">
            Client not found
          </h1>
          <p className="text-gray-600">
            No client record exists for this ID.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
        <Link
          href={`/clients/${client.id}`}
          className="mb-6 inline-flex font-semibold text-emerald-700 hover:text-emerald-800"
        >
          Back to Client
        </Link>

        <h1 className="mb-3 text-4xl font-bold text-black">Edit Client</h1>
        <p className="mb-8 text-gray-600">
          Update outreach status, follow-up timing, and saved criteria.
        </p>

        <ClientForm mode="edit" client={client} />
      </div>
    </main>
  );
}
