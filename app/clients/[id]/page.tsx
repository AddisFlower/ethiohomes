import Link from "next/link";
import { redirect } from "next/navigation";
import {
  canUseAgentFeatures,
  getAppSession,
  isAuthenticated,
} from "@/lib/auth";
import {
  getAgentClientById,
  getClientListingMatches,
} from "@/lib/clients";
import { getListingsForViewer } from "@/lib/listings";
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

function formatPrice(value: number | null) {
  return value === null ? "Any" : `${value.toLocaleString("en-US")} ETB`;
}

export default async function ClientDetailPage({
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

  const listings = await getListingsForViewer(
    session.role,
    session.user.id,
    isAuthenticated(session) ? session.accessToken : undefined
  );
  const matches = getClientListingMatches(client, listings);

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/clients"
              className="mb-5 inline-flex font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Back to Clients
            </Link>
            <h1 className="text-4xl font-bold text-black">{client.name}</h1>
            <p className="mt-2 text-gray-600">{client.email}</p>
          </div>

          <Link
            href={`/clients/${client.id}/edit`}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800"
          >
            Edit Client
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-md">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                  {client.status}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                  {client.source}
                </span>
                {client.alertEnabled && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                    {client.alertFrequency} Alert Saved
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-semibold text-black">
                    {client.phone ?? "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Next Follow-up</p>
                  <p className="font-semibold text-black">
                    {formatDate(client.nextFollowUpAt)}
                  </p>
                </div>
              </div>

              {client.notes && (
                <div className="mt-6 rounded-lg bg-gray-50 p-4 text-gray-700">
                  <p className="mb-1 text-sm font-semibold text-black">
                    Notes
                  </p>
                  <p>{client.notes}</p>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 text-2xl font-bold text-black">
                Matching Listings
              </h2>

              {matches.length === 0 ? (
                <p className="text-gray-600">
                  No current listings match this saved criteria.
                </p>
              ) : (
                <div className="grid gap-4">
                  {matches.slice(0, 6).map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/listings/${listing.id}`}
                      className="rounded-lg border border-gray-200 p-4 transition hover:border-emerald-700"
                    >
                      <p className="font-bold text-black">{listing.title}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {listing.price} - {listing.location}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {listing.propertyType} / {listing.transactionType} /{" "}
                        {listing.marketStatus}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 text-2xl font-bold text-black">
                Saved Criteria
              </h2>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-gray-500">Location:</span>{" "}
                  <span className="font-semibold text-black">
                    {client.preferredLocation ?? "Any"}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Property:</span>{" "}
                  <span className="font-semibold text-black">
                    {client.preferredPropertyType ?? "Any"}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Transaction:</span>{" "}
                  <span className="font-semibold text-black">
                    {client.preferredTransactionType ?? "Any"}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Market:</span>{" "}
                  <span className="font-semibold text-black">
                    {client.preferredMarketStatus ?? "Any"}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Budget:</span>{" "}
                  <span className="font-semibold text-black">
                    {formatPrice(client.minPrice)} -{" "}
                    {formatPrice(client.maxPrice)}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Rooms:</span>{" "}
                  <span className="font-semibold text-black">
                    {client.minBedrooms ?? "Any"}+ beds,{" "}
                    {client.minBathrooms ?? "Any"}+ baths
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-blue-900">
              <h2 className="mb-2 text-xl font-bold">Alert Status</h2>
              <p className="text-sm">
                {client.alertEnabled
                  ? "Saved criteria are ready for automated email alerts once email sending is enabled."
                  : "Automated alerts are disabled for this client."}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
