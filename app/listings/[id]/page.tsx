import { properties } from "@/data/properties";
import Link from "next/link";

export default async function PropertyDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const property = properties.find((p) => p.id === id);

  if (!property) {
    return <div className="p-10 text-2xl text-black">Property not found.</div>;
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

        <p className="text-3xl text-green-700 font-bold mb-4">
          {property.price}
        </p>

        <p className="text-xl text-gray-600 mb-6">{property.location}</p>

        <div className="flex gap-6 mb-8 text-lg text-black">
          <span>🛏 {property.bedrooms} Bedrooms</span>
          <span>🛁 {property.bathrooms} Bathrooms</span>
        </div>

        <p className="text-gray-700 text-lg leading-8 mb-8">
          {property.description}
        </p>

        <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold">
          Contact Agent
        </button>
      </div>
    </main>
  );
}