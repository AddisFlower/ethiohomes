import { properties } from "@/data/properties";
import Link from "next/link";

export default async function PropertyDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const property = properties.find((p) => p.id === id);

  const currentAgentId = "agent-1";
  const isOwner = property?.ownerId === currentAgentId;

  if (!property) {
    return (
      <div className="p-10 text-2xl text-black">
        Property not found.
      </div>
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

        <div className="flex flex-wrap gap-4">
          {isOwner ? (
            <>
              <Link href={`/listings/${property.id}/edit`}>
                <button className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-4 rounded-xl text-lg font-semibold transition">
                  Edit Listing
                </button>
              </Link>

              <button className="border border-gray-300 hover:border-emerald-700 hover:text-emerald-700 text-black px-8 py-4 rounded-xl text-lg font-semibold transition">
                Manage Photos
              </button>

              <button className="border border-red-300 hover:border-red-600 hover:text-red-600 text-red-600 px-8 py-4 rounded-xl text-lg font-semibold transition">
                Delete Listing
              </button>
            </>
          ) : (
            <>
              <button className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-4 rounded-xl text-lg font-semibold transition">
                Request Showing
              </button>

              <button className="border border-gray-300 hover:border-emerald-700 hover:text-emerald-700 text-black px-8 py-4 rounded-xl text-lg font-semibold transition">
                Save Listing
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}