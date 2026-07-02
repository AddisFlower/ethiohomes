import Image from "next/image";
import {
  getListingById,
  isListingReadError,
} from "@/lib/listings";
import {
  canManageListing,
  getAppSession,
  isAuthenticated,
} from "@/lib/auth";
import {
  canViewFullComingSoonDetails,
  canViewerBrowseListing,
  getShowingEligibility,
} from "@/lib/listing-rules";
import ListingsUnavailable from "@/components/ListingsUnavailable";
import ListingDetailActions from "./ListingDetailActions";

export default async function PropertyDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getAppSession();
  let property;

  try {
    property = await getListingById(
      id,
      isAuthenticated(session) ? session.accessToken : undefined
    );
  } catch (error) {
    if (isListingReadError(error)) {
      return <ListingsUnavailable />;
    }

    throw error;
  }

  const isOwner = property ? canManageListing(session, property) : false;
  const canViewListing =
    property &&
    canViewerBrowseListing(
      property,
      session.role,
      isAuthenticated(session) ? session.user.id : undefined
    );
  const showingEligibility = property
    ? getShowingEligibility(property)
    : { allowed: false, message: null };
  const canViewFullDetails = property
    ? canViewFullComingSoonDetails(property, session.role)
    : false;

  if (!property || !canViewListing) {
    return (
      <main className="min-h-screen bg-gray-100 py-12 px-6">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
          <h1 className="text-4xl font-bold text-black mb-4">
            Property not found
          </h1>

          <p className="text-gray-600">
            No listing exists for this property ID.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto py-12 px-6">
        <div className="relative mb-8 h-[500px] w-full overflow-hidden rounded-2xl">
          <Image
            src={property.image}
            alt={property.title}
            fill
            priority
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-cover"
          />
        </div>

        <h1 className="text-5xl font-bold text-black mb-4">
          {property.title}
        </h1>

        <p className="text-3xl text-emerald-700 font-bold mb-4">
          {canViewFullDetails
            ? property.price
            : "Price available to signed-in agents"}
        </p>

        <p className="text-xl text-gray-600 mb-6">
          {property.location}
        </p>

        {!canViewFullDetails && (
          <div className="mb-8 rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-900">
            <p className="font-semibold">Coming Soon preview</p>
            <p className="mt-1 text-sm">
              Public visitors can see this listing is upcoming. Signed-in
              agents can view the full property details.
            </p>
          </div>
        )}

        {canViewFullDetails && property.address && (
          <p className="text-lg text-gray-700 mb-6">
            {property.address}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">
            {property.transactionType}
          </span>

          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
            {property.marketStatus}
          </span>

          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
            {property.approvalStatus}
          </span>

          {isOwner && (
            <span className="bg-black text-white px-3 py-1 rounded-full text-sm font-semibold">
              OWNED BY YOU
            </span>
          )}
        </div>

        {isOwner &&
          property.approvalStatus === "Rejected" &&
          property.rejectionReason && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-5 text-red-700 mb-8">
              <p className="font-semibold">Listing rejected.</p>
              <p className="text-sm mt-1">{property.rejectionReason}</p>
            </div>
          )}

        {canViewFullDetails && (
          <div className="bg-white rounded-xl shadow-md p-5 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Listing ID</p>
              <p className="font-semibold text-black">
                {property.listingId}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Agent</p>
              <p className="font-semibold text-black">
                {property.agent}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Last Updated</p>
              <p className="font-semibold text-black">
                {property.updatedAt}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-5 mb-8 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Bedrooms</p>
            <p className="font-semibold text-black">
              {canViewFullDetails
                ? property.bedrooms ?? "Not applicable"
                : "Agents only"}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Bathrooms</p>
            <p className="font-semibold text-black">
              {canViewFullDetails
                ? property.bathrooms ?? "Not applicable"
                : "Agents only"}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Property Type</p>
            <p className="font-semibold text-black">
              {property.propertyType}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Listing Type</p>
            <p className="font-semibold text-black">
              {property.transactionType}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Market Status</p>
            <p className="font-semibold text-black">
              {property.marketStatus}
            </p>
          </div>
        </div>

        {canViewFullDetails ? (
          <p className="text-gray-700 text-lg leading-8 mb-8">
            {property.description}
          </p>
        ) : (
          <p className="text-gray-700 text-lg leading-8 mb-8">
            More property details will be available to signed-in agents.
          </p>
        )}

        {canViewFullDetails ? (
          <ListingDetailActions
            isOwner={isOwner}
            listingId={property.id}
            showingAllowed={showingEligibility.allowed}
            showingUnavailableMessage={showingEligibility.message}
          />
        ) : (
          <div className="rounded-xl bg-white p-5 shadow-md">
            <p className="font-semibold text-black">
              Full Coming Soon details are available to signed-in agents.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
