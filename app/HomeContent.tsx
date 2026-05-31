"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Property } from "@/lib/listings";

type HomeContentProps = {
  properties: Property[];
};

export default function HomeContent({ properties }: HomeContentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchTerm.trim();
    router.push(
      query ? `/listings?search=${encodeURIComponent(query)}` : "/listings"
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-slate-900 to-black text-white py-15 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Modern Tools for Ethiopian Real Estate
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mb-6">
            Manage listings, clients, and property activity with EthioMLS.
          </p>

          <form onSubmit={handleSearchSubmit}>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search by city, neighborhood, or title..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="flex-1 px-4 py-3 rounded-lg text-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />

              <select className="px-4 py-3 rounded-lg text-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-700">
                <option className="bg-white text-black">All Listings</option>
                <option className="bg-white text-black">
                  Residential Sale
                </option>
                <option className="bg-white text-black">
                  Residential Rent
                </option>
                <option className="bg-white text-black">Multi-Family</option>
                <option className="bg-white text-black">Land</option>
                <option className="bg-white text-black">Commercial Sale</option>
                <option className="bg-white text-black">Commercial Rent</option>
              </select>

              <select className="px-4 py-3 rounded-lg text-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-700">
                <option className="bg-white text-black">
                  All Property Types
                </option>
                <option className="bg-white text-black">Apartment</option>
                <option className="bg-white text-black">Villa</option>
                <option className="bg-white text-black">Condo</option>
                <option className="bg-white text-black">Office</option>
                <option className="bg-white text-black">Land</option>
              </select>

              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-6 py-3 rounded-lg transition"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* AGENT WORKSPACE */}
      <section className="max-w-6xl mx-auto py-12 px-6">
        <h2 className="text-3xl font-bold text-black mb-2">Agent Workspace</h2>

        <p className="text-gray-600 mb-8">
          Quick overview of your listings, clients, and daily activity.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-700">
            <h3 className="text-xl font-bold text-black mb-2">
              Recent Listings
            </h3>
            <p className="text-3xl font-bold text-emerald-700 mb-3">12</p>
            <p className="text-gray-600">Active listings currently managed.</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <h3 className="text-xl font-bold text-black mb-2">
              Client Inquiries
            </h3>
            <p className="text-3xl font-bold text-yellow-600 mb-3">5</p>
            <p className="text-gray-600">New inquiries waiting for response.</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-600">
            <h3 className="text-xl font-bold text-black mb-2">
              Pending Approvals
            </h3>
            <p className="text-3xl font-bold text-red-600 mb-3">2</p>
            <p className="text-gray-600">
              Listings awaiting admin verification.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-700">
            <h3 className="text-xl font-bold text-black mb-2">
              Upcoming Showings
            </h3>
            <p className="text-3xl font-bold text-emerald-700 mb-3">3</p>
            <p className="text-gray-600">Scheduled property tours this week.</p>
          </div>
        </div>
      </section>

      {/* PROPERTY SECTION */}
      <section className="max-w-6xl mx-auto py-16 px-6">
        <h2 className="text-3xl font-bold mb-8 text-black">
          Promoted Listings
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

                </div>
                <h3 className="text-2xl font-semibold text-black mb-2">
                  {property.title}
                </h3>

                <p className="text-green-700 font-bold text-lg mb-2">
                  {property.price}
                </p>

                <p className="text-gray-600 mb-4">{property.location}</p>

                <div className="mt-4 space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-semibold text-black">
                      Listing ID:
                    </span>{" "}
                    {property.listingId}
                  </p>

                  <p>
                    <span className="font-semibold text-black">Agent:</span>{" "}
                    {property.agent}
                  </p>

                  <p>
                    <span className="font-semibold text-black">Status:</span>{" "}
                    {property.approvalStatus}
                  </p>

                  <p className="text-xs text-gray-500">{property.updatedAt}</p>
                </div>

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
