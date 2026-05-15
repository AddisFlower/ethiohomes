"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { properties } from "@/data/properties";

function ListingsContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [listingStatus, setListingStatus] = useState("ALL");
  const [propertyType, setPropertyType] = useState("ALL");

  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.get("search");

    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  const filteredProperties = properties.filter((property) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      property.title.toLowerCase().includes(search) ||
      property.location.toLowerCase().includes(search);

    const matchesStatus =
      listingStatus === "ALL" || property.status === listingStatus;

    const matchesPropertyType =
      propertyType === "ALL" || property.propertyType === propertyType;

    return matchesSearch && matchesStatus && matchesPropertyType;
  });

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-4">
          Browse Properties
        </h1>

        <p className="text-gray-600 mb-8">
          Search available homes, apartments, land, and commercial properties.
        </p>

        <input
          type="text"
          placeholder="Search by city, neighborhood, or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white text-black px-4 py-3 rounded-lg w-full md:w-96 border border-gray-300 mb-8"
        />

        <select
          value={listingStatus}
          onChange={(e) => setListingStatus(e.target.value)}
          className="bg-white text-black px-4 py-3 rounded-lg border border-gray-300 mb-8 ml-4"
        >
          <option value="ALL">All Listings</option>
          <option value="FOR SALE">For Sale</option>
          <option value="FOR RENT">For Rent</option>
        </select>

        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="bg-white text-black px-4 py-3 rounded-lg border border-gray-300 mb-8 ml-4"
        >
          <option value="ALL">All Property Types</option>
          <option value="Apartment">Apartment</option>
          <option value="Villa">Villa</option>
          <option value="House">House</option>
        </select>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredProperties.map((property) => (
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

                <Link href={`/listings/${property.id}`}>
                  <button className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 cursor-pointer">
                    View Details
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function ListingsPage() {
  return (
    <Suspense>
      <ListingsContent />
    </Suspense>
  );
}