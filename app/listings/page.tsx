"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { properties } from "@/data/properties";

function ListingsContent() {

  
  // TODO: Replace this mock agent ID with the authenticated user's ID
  // once login/auth is implemented.
  const currentAgentId = "agent-1";
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("search") ?? ""
  );
  const [listingStatus, setListingStatus] = useState("ALL");
  const [propertyType, setPropertyType] = useState("ALL");

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
        {filteredProperties.map((property) => {
          const isOwner = property.ownerId === currentAgentId;

          return (
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

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                    {property.status}
                  </span>

                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                    {property.approvalStatus}
                  </span>

                  {isOwner && (
                    <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-semibold">
                      OWNED BY YOU
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <Link href={`/listings/${property.id}`}>
                    <button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-lg cursor-pointer transition">
                      View Details
                    </button>
                  </Link>

                  {isOwner ? (
                    <Link href={`/listings/${property.id}/edit`}>
                      <button className="w-full border border-gray-300 hover:border-emerald-700 hover:text-emerald-700 text-black py-3 rounded-lg transition">
                        Edit Listing
                      </button>
                    </Link>
                  ) : (
                    <button className="w-full border border-gray-300 hover:border-emerald-700 hover:text-emerald-700 text-black py-3 rounded-lg transition">
                      Request Showing
                    </button>
                  )}
              </div>
              </div>
            </div>
            );
          })}
        </div>

        {filteredProperties.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-black mb-3">
              No listings found
            </h2>

            <p className="text-gray-600 mb-6">
              Try adjusting your search, listing status, or property type.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setListingStatus("ALL");
                setPropertyType("ALL");
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Clear Filters
            </button>
          </div>
        )}
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
