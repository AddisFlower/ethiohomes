import PropertyForm from "@/components/PropertyForm";
import { properties } from "@/data/properties";

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
  const property = properties.find((p) => p.id === id);
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

        <PropertyForm
          mode="edit"
          defaultValues={{
            title: property.title,
            price: getNumericPrice(property.price),
            city: getCity(property.location),
            propertyType: property.propertyType,
            listingType: property.status,
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
