"use client";

import { properties } from "@/data/properties";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const filteredProperties = properties.filter((property) =>
    property.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gray-100">
      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-black to-gray-900 text-white py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">
            Find Your Dream Home in Ethiopia
          </h1>

          <p className="text-xl text-gray-300 mb-8">
            Discover apartments, villas, and investment properties across
            Ethiopia.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();

              router.push(
                `/listings?search=${encodeURIComponent(searchTerm)}`
              );
            }}
            className="flex gap-4 flex-wrap"
          >
            <input
              type="text"
              placeholder="Search by city or neighborhood..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white text-black px-4 py-3 rounded-lg w-full md:w-96"
            />

            <button
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* PROPERTY SECTION */}
      <section className="max-w-6xl mx-auto py-16 px-6">
        <h2 className="text-3xl font-bold mb-8 text-black">
          Featured Properties
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {properties.map((property) => (
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
                <div className="flex gap-2 mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      property.status === "FOR SALE"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {property.status}
                  </span>

                  {property.verified && (
                    <span className="bg-black text-white px-3 py-1 rounded-full text-sm font-semibold">
                      VERIFIED
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-semibold text-black mb-2">
                  {property.title}
                </h3>

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
      </section>
    </main>
  );
}
