import Link from "next/link";
import { canUseAdminFeatures, getAppSession } from "@/lib/auth";
import AgentProfileRequired from "@/components/AgentProfileRequired";
import {
  getAdminSellerLeads,
  getAssignableAgents,
} from "@/lib/seller-leads";
import SellerLeadAssignmentForm from "./SellerLeadAssignmentForm";

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusClass(status: string) {
  if (status === "Assigned") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "Contacted") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "Closed") {
    return "bg-gray-200 text-gray-700";
  }

  return "bg-yellow-100 text-yellow-800";
}

export default async function AdminSellerLeadsPage() {
  const session = await getAppSession();
  const isAdmin = canUseAdminFeatures(session);

  if (session.role === "incomplete") {
    return <AgentProfileRequired />;
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-12">
        <div className="mx-auto max-w-6xl rounded-xl bg-white p-8 shadow-md">
          <h1 className="mb-3 text-2xl font-bold text-black">Access denied</h1>
          <p className="text-gray-600">
            You do not have permission to assign seller leads.
          </p>
        </div>
      </main>
    );
  }

  const [sellerLeads, agents] = await Promise.all([
    getAdminSellerLeads(),
    getAssignableAgents(),
  ]);

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-emerald-700">
              Admin
            </p>
            <h1 className="text-4xl font-bold text-black">Seller Leads</h1>
            <p className="mt-2 text-gray-600">
              Review public seller requests and assign them to an agent.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 font-semibold text-black transition hover:border-emerald-700 hover:text-emerald-700"
          >
            Back to Listing Review
          </Link>
        </div>

        {agents.length === 0 && (
          <div className="mb-6 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-yellow-900">
            No agent profiles were found. Create an agent account before
            assigning seller leads.
          </div>
        )}

        {sellerLeads.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-md">
            <h2 className="mb-3 text-2xl font-bold text-black">
              No seller leads yet
            </h2>
            <p className="text-gray-600">
              Seller requests from the home Sell tab will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {sellerLeads.map((lead) => (
              <div key={lead.id} className="rounded-xl bg-white p-6 shadow-md">
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                  <div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span
                        className={`${getStatusClass(
                          lead.status
                        )} rounded-full px-3 py-1 text-sm font-semibold`}
                      >
                        {lead.status}
                      </span>
                      {lead.intent && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                          {lead.intent}
                        </span>
                      )}
                      {lead.propertyType && (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                          {lead.propertyType}
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-bold text-black">
                      {lead.propertyAddress}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Submitted {formatDate(lead.createdAt)}
                    </p>

                    <div className="mt-5 grid gap-3 text-gray-700 md:grid-cols-2">
                      <p>
                        <span className="font-semibold text-black">
                          Seller:
                        </span>{" "}
                        {lead.sellerName}
                      </p>
                      <p>
                        <span className="font-semibold text-black">
                          Phone:
                        </span>{" "}
                        {lead.sellerPhone}
                      </p>
                      {lead.sellerEmail && (
                        <p>
                          <span className="font-semibold text-black">
                            Email:
                          </span>{" "}
                          <a
                            href={`mailto:${lead.sellerEmail}`}
                            className="text-emerald-700 underline hover:text-emerald-800"
                          >
                            {lead.sellerEmail}
                          </a>
                        </p>
                      )}
                      {lead.preferredContactMethod && (
                        <p>
                          <span className="font-semibold text-black">
                            Preferred contact:
                          </span>{" "}
                          {lead.preferredContactMethod}
                        </p>
                      )}
                    </div>

                    {lead.notes && (
                      <div className="mt-5 rounded-lg bg-gray-50 p-4 text-gray-700">
                        <span className="font-semibold text-black">
                          Notes:
                        </span>{" "}
                        {lead.notes}
                      </div>
                    )}

                    {lead.assignedAgentId && (
                      <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                        <span className="font-semibold">Assigned to:</span>{" "}
                        {lead.assignedAgentName ?? "Unnamed agent"}
                        {lead.assignedAgentAgency
                          ? `, ${lead.assignedAgentAgency}`
                          : ""}
                      </div>
                    )}
                  </div>

                  <SellerLeadAssignmentForm
                    agents={agents}
                    currentAgentId={lead.assignedAgentId}
                    leadId={lead.id}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
