import Link from "next/link";
import { redirect } from "next/navigation";
import { canUseAgentFeatures, getAppSession } from "@/lib/auth";
import { getListingsByOwner } from "@/lib/listings";

export default async function MyListingsPage() {
  const session = await getAppSession();

  if (!canUseAgentFeatures(session)) {
    redirect("/login");
  }

  const myListings = await getListingsByOwner(session.user.id);

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-4">
          My EthioMLS Listings
        </h1>

        <p className="text-gray-600 mb-8">
          Manage your active and pending property listings.
        </p>

        {myListings.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-black mb-3">
              You do not have any listings yet
            </h2>

            <p className="text-gray-600 mb-6">
              Add your first property listing to start managing it from this
              page.
            </p>

            <Link
              href="/add-listing"
              className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Add Listing
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {myListings.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-xl overflow-hidden shadow-lg hover:scale-105 transition duration-300"
            >
              <img
                src={property.image}
                alt={property.title}
                className="h-56 w-full object-cover"
              />

              <div className="p-5">
                <h2 className="text-2xl font-semibold text-black mb-2">
                  {property.title}
                </h2>

                <p className="text-green-700 font-bold text-lg mb-2">
                  {property.price}
                </p>

                <p className="text-gray-600 mb-4">{property.location}</p>

                {property.address && (
                  <p className="text-gray-500 text-sm mb-4">
                    {property.address}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                    {property.transactionType}
                  </span>

                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                    {property.marketStatus}
                  </span>

                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                    {property.approvalStatus}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                  <div className="flex justify-between gap-4 mb-2">
                    <span className="text-gray-500">Listing ID</span>
                    <span className="font-semibold text-black">
                      {property.listingId}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Last Updated</span>
                    <span className="font-semibold text-black">
                      {property.updatedAt}
                    </span>
                  </div>
                </div>

                {property.approvalStatus === "Rejected" &&
                  property.rejectionReason && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 mb-4 text-sm text-red-700">
                      <p className="font-semibold">Rejection reason</p>
                      <p>{property.rejectionReason}</p>
                    </div>
                  )}

                <div className="flex flex-col gap-3">
                  <Link href={`/listings/${property.id}/edit`}>
                    <button className="w-full border border-gray-300 hover:border-emerald-700 hover:text-emerald-700 text-black py-3 rounded-lg transition">
                      Edit Listing
                    </button>
                  </Link>

                  <Link href={`/listings/${property.id}`}>
                    <button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-lg cursor-pointer transition">
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
