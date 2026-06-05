import { getListingById } from "@/lib/listings";
import { canManageListing, getAppSession } from "@/lib/auth";
import EditListingForm from "./EditListingForm";
import { redirect } from "next/navigation";

function getNumericPrice(price: string) {
  return price.replace(/\D/g, "");
}

function getCity(location: string) {
  return location.split(",")[0]?.trim() || location;
}

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getListingById(id);
  const session = await getAppSession();

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

  if (session.role === "public") {
    redirect("/login");
  }

  if (!canManageListing(session, property)) {
    return (
      <main className="min-h-screen bg-gray-100 py-12 px-6">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
          <h1 className="text-4xl font-bold text-black mb-4">
            Access denied
          </h1>

          <p className="text-gray-600">
            You do not have permission to edit this listing.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-4xl font-bold text-black mb-8">
          Edit Property Listing
        </h1>

        <EditListingForm
          approvalStatus={property.approvalStatus}
          listingId={property.id}
          rejectionReason={property.rejectionReason}
          defaultValues={{
            title: property.title,
            price: getNumericPrice(property.price),
            city: getCity(property.location),
            address: property.address ?? "",
            propertyType: property.propertyType,
            transactionType: property.transactionType,
            marketStatus: property.marketStatus,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            description: property.description,
            image: property.image,
          }}
        />
      </div>
    </main>
  );
}
