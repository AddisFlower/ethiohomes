import Link from "next/link";
import { redirect } from "next/navigation";
import { canUseAgentFeatures, getAppSession } from "@/lib/auth";
import AgentProfileRequired from "@/components/AgentProfileRequired";
import ClientForm from "../ClientForm";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string;
    name?: string;
    notes?: string;
    phone?: string;
    source?: string;
  }>;
}) {
  const session = await getAppSession();
  const defaults = await searchParams;

  if (session.role === "public") {
    redirect("/login");
  }

  if (!canUseAgentFeatures(session)) {
    return <AgentProfileRequired />;
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
        <Link
          href="/clients"
          className="mb-6 inline-flex font-semibold text-emerald-700 hover:text-emerald-800"
        >
          Back to Clients
        </Link>

        <h1 className="mb-3 text-4xl font-bold text-black">Add Client</h1>
        <p className="mb-8 text-gray-600">
          Create an agent-owned client record with follow-up and saved criteria.
        </p>

        <ClientForm
          mode="create"
          defaultValues={{
            email: defaults.email,
            name: defaults.name,
            notes: defaults.notes,
            phone: defaults.phone,
            source: defaults.source,
          }}
        />
      </div>
    </main>
  );
}
