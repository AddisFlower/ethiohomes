import Link from "next/link";
import { canUseAdminFeatures, getAppSession } from "@/lib/auth";
import AgentProfileRequired from "@/components/AgentProfileRequired";
import {
  type AdminListingStatusFilter,
  getAdminListings,
} from "@/lib/listings";
import AdminApprovalActions from "./AdminApprovalActions";

const statusFilters: AdminListingStatusFilter[] = [
  "Unapproved",
  "Approved",
  "Rejected",
  "All",
];

function getStatusFilter(value: string | string[] | undefined) {
  const status = Array.isArray(value) ? value[0] : value;

  if (
    status === "Unapproved" ||
    status === "Approved" ||
    status === "Rejected" ||
    status === "All"
  ) {
    return status;
  }

  return "Unapproved";
}

function getApprovalClass(status: string) {
  if (status === "Approved") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "Rejected") {
    return "bg-red-100 text-red-700";
  }

  return "bg-yellow-100 text-yellow-800";
}

function getMarketClass(status: string) {
  if (status === "Active") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "Off Market") {
    return "bg-gray-200 text-gray-700";
  }

  if (status === "Closed") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-yellow-100 text-yellow-800";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const session = await getAppSession();
  const { status } = await searchParams;
  const activeStatus = getStatusFilter(status);
  const isAdmin = canUseAdminFeatures(session);
  const listings = isAdmin ? await getAdminListings(activeStatus) : [];

  if (session.role === "incomplete") {
    return <AgentProfileRequired />;
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black">
            Admin Review Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Review submitted property listings and manage approval status.
          </p>
        </div>

        {!isAdmin && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-black mb-3">
              Access denied
            </h2>
            <p className="text-gray-600">
              You do not have permission to review listings.
            </p>
          </div>
        )}

        {isAdmin && (
          <>
            <div className="mb-6 flex flex-wrap gap-3">
              {statusFilters.map((filter) => (
                <Link
                  key={filter}
                  href={`/admin?status=${filter}`}
                  className={`px-4 py-2 rounded-lg font-semibold border transition ${
                    activeStatus === filter
                      ? "bg-emerald-700 border-emerald-700 text-white"
                      : "bg-white border-gray-300 text-black hover:border-emerald-700 hover:text-emerald-700"
                  }`}
                >
                  {filter}
                </Link>
              ))}
            </div>

            {listings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <h2 className="text-2xl font-bold text-black mb-3">
                  No {activeStatus.toLowerCase()} listings
                </h2>
                <p className="text-gray-600">
                  Listings matching this review status will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className="h-56 w-full object-cover md:h-full"
                      />

                      <div className="p-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span
                              className={`${getApprovalClass(
                                listing.approvalStatus
                              )} px-3 py-1 rounded-full text-sm font-semibold`}
                            >
                              {listing.approvalStatus}
                            </span>

                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                              {listing.listingId}
                            </span>

                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                              {listing.transactionType}
                            </span>

                            <span
                              className={`${getMarketClass(
                                listing.marketStatus
                              )} px-3 py-1 rounded-full text-sm font-semibold`}
                            >
                              {listing.marketStatus}
                            </span>
                          </div>

                          <h2 className="text-2xl font-bold text-black">
                            {listing.title}
                          </h2>

                          <p className="text-emerald-700 font-bold text-lg mt-1">
                            {listing.price}
                          </p>

                          <p className="text-gray-600 mt-1">
                            {listing.location}
                          </p>

                          {listing.address && (
                            <p className="text-gray-500 mt-1">
                              Address: {listing.address}
                            </p>
                          )}

                          <p className="text-gray-500 mt-2">
                            Agent: {listing.agent}
                          </p>

                          {listing.rejectionReason && (
                            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                              <span className="font-semibold">
                                Rejection reason:
                              </span>{" "}
                              {listing.rejectionReason}
                            </div>
                          )}

                          <Link
                            href={`/listings/${listing.id}`}
                            className="inline-block mt-4 text-emerald-700 hover:text-emerald-800 font-semibold"
                          >
                            View listing
                          </Link>
                        </div>

                        <AdminApprovalActions
                          approvalStatus={listing.approvalStatus}
                          listingId={listing.id}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
