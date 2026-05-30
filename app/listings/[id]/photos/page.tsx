import Link from "next/link";
import { getListingById } from "@/lib/listings";

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

        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-800 mb-6">
          <p className="font-semibold">Photo management coming soon.</p>
          <p className="text-sm">
            Image uploads and photo ordering will be added after photo
            management is implemented.
          </p>
        </div>

        <Link
          href={`/listings/${property.id}`}
          className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          Back to Listing
        </Link>
      </div>
    </main>
  );
}
