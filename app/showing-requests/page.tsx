import Link from "next/link";
import { redirect } from "next/navigation";
import { canUseAgentFeatures, getAppSession } from "@/lib/auth";
import { getShowingRequests } from "@/lib/showing-requests";
import AgentProfileRequired from "@/components/AgentProfileRequired";

function formatCreatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPreferredDate(value: string | null) {
  if (!value) {
    return "No preference";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function ShowingRequestsPage() {
  const session = await getAppSession();

  if (session.role === "public") {
    redirect("/login");
  }

  if (!canUseAgentFeatures(session)) {
    return <AgentProfileRequired />;
  }

  const requests = await getShowingRequests(session.user.id);

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black">Showing Requests</h1>
          <p className="text-gray-600 mt-2">
            Review buyer and renter inquiries submitted from listing detail
            pages.
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-black mb-3">
              No showing requests yet
            </h2>
            <p className="text-gray-600">
              New requests for your listings will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {request.status}
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {request.listingMlsId}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold text-black">
                      {request.listingTitle}
                    </h2>

                    <p className="text-gray-500 mt-1">
                      Submitted {formatCreatedAt(request.createdAt)}
                    </p>
                  </div>

                  <Link
                    href={`/listings/${request.listingId}`}
                    className="inline-flex text-emerald-700 font-semibold hover:text-emerald-800"
                  >
                    View Listing
                  </Link>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Requester</p>
                    <p className="font-semibold text-black">
                      {request.requesterName}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-semibold text-black">
                      {request.requesterEmail}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-semibold text-black">
                      {request.requesterPhone ?? "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Preferred Date/Time</p>
                    <p className="font-semibold text-black">
                      {formatPreferredDate(request.preferredDatetime)}
                    </p>
                  </div>
                </div>

                {request.message && (
                  <div className="mt-5 rounded-lg bg-gray-50 p-4 text-gray-700">
                    <p className="text-sm font-semibold text-black mb-1">
                      Message
                    </p>
                    <p>{request.message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
