import { getListingById } from "@/lib/listings";
import ListingDetailActions from "./ListingDetailActions";

export default async function PropertyDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const property = await getListingById(id);

  const currentAgentId = "agent-1";
  const isOwner = property?.ownerId === currentAgentId;

  if (!property) {
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
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-[500px] object-cover rounded-2xl mb-8"
        />

        <h1 className="text-5xl font-bold text-black mb-4">
          {property.title}
        </h1>

        <p className="text-3xl text-emerald-700 font-bold mb-4">
          {property.price}
        </p>

        <p className="text-xl text-gray-600 mb-6">
          {property.location}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">
            {property.status}
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

        <div className="bg-white rounded-xl shadow-md p-5 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Bedrooms</p>
            <p className="font-semibold text-black">
              {property.bedrooms}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Bathrooms</p>
            <p className="font-semibold text-black">
              {property.bathrooms}
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
              {property.status}
            </p>
          </div>
        </div>

        <p className="text-gray-700 text-lg leading-8 mb-8">
          {property.description}
        </p>

        <ListingDetailActions isOwner={isOwner} listingId={property.id} />
      </div>
    </main>
  );
}
