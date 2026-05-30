import Link from "next/link";
import { getListingById } from "@/lib/listings";
import PhotoManagementForm from "./PhotoManagementForm";

export default async function ManagePhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getListingById(id);
  // TODO: Replace this mock agent ID with the authenticated user's ID
  // once login/auth is implemented.
  const currentAgentId = "agent-1";

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

  if (property.ownerId !== currentAgentId) {
    return (
      <main className="min-h-screen bg-gray-100 py-12 px-6">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
          <h1 className="text-4xl font-bold text-black mb-4">
            Access denied
          </h1>

          <p className="text-gray-600">
            You do not have permission to manage photos for this listing.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-4xl font-bold text-black mb-4">
          Manage Photos
        </h1>

        <p className="text-gray-600 mb-6">
          {property.title}
        </p>

        <div className="mb-6">
          <img
            src={property.image}
            alt={property.title}
            className="h-72 w-full rounded-xl object-cover"
          />
        </div>

        <PhotoManagementForm listingId={property.id} />

        <Link
          href={`/listings/${property.id}`}
          className="mt-6 inline-block border border-emerald-700 text-emerald-700 hover:bg-emerald-100 px-6 py-3 rounded-lg font-semibold transition"
        >
          Back to Listing
        </Link>
      </div>
    </main>
  );
}
