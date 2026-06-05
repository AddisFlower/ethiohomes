"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Property } from "@/lib/listings";

type HomeContentProps = {
  properties: Property[];
  isAgent: boolean;
  isAdmin: boolean;
};

export default function HomeContent({
  properties,
  isAgent,
  isAdmin,
}: HomeContentProps) {
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
            {isAgent || isAdmin
              ? "Agent Dashboard"
              : "Browse Ethiopian Real Estate"}
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mb-6">
            {isAgent || isAdmin
              ? "Manage listings, review activity, and keep your properties moving."
              : "Search listings, compare properties, and connect with verified agents."}
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

          {!isAgent && !isAdmin && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-5 py-3 rounded-lg transition"
              >
                Sign In
              </Link>

              <Link
                href="/signup"
                className="inline-flex items-center justify-center border border-white/30 text-white font-semibold px-5 py-3 rounded-lg hover:bg-white/10 transition"
              >
                Create Agent Account
              </Link>
            </div>
          )}
        </div>
      </section>

      {(isAgent || isAdmin) && (
        <section className="max-w-6xl mx-auto py-12 px-6">
          <h2 className="text-3xl font-bold text-black mb-2">
            {isAdmin ? "Admin and Agent Workspace" : "Agent Dashboard"}
          </h2>

          <p className="text-gray-600 mb-8">
            {isAdmin
              ? "Review your listings and jump into admin tools when needed."
              : "Quick access to your listings and the main agent actions."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-700">
              <h3 className="text-xl font-bold text-black mb-2">
                My Listings
              </h3>
              <p className="text-gray-600 mb-4">
                Open your active, pending, and rejected listings.
              </p>
              <Link
                href="/my-listings"
                className="inline-flex text-emerald-700 font-semibold hover:text-emerald-800"
              >
                View My Listings
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
              <h3 className="text-xl font-bold text-black mb-2">
                Add Listing
              </h3>
              <p className="text-gray-600 mb-4">
                Submit a new property and send it for review.
              </p>
              <Link
                href="/add-listing"
                className="inline-flex text-emerald-700 font-semibold hover:text-emerald-800"
              >
                Create Listing
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-600">
              <h3 className="text-xl font-bold text-black mb-2">
                Manage Listings
              </h3>
              <p className="text-gray-600 mb-4">
                Update your properties and handle ownership actions.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/my-listings"
                  className="inline-flex text-emerald-700 font-semibold hover:text-emerald-800"
                >
                  Edit and Review
                </Link>

                <Link
                  href="/showing-requests"
                  className="inline-flex text-emerald-700 font-semibold hover:text-emerald-800"
                >
                  Showing Requests
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="inline-flex text-emerald-700 font-semibold hover:text-emerald-800"
                  >
                    Admin Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {!isAgent && !isAdmin && (
        <section className="max-w-6xl mx-auto py-12 px-6">
          <h2 className="text-3xl font-bold text-black mb-2">
            Start Searching
          </h2>

          <p className="text-gray-600 mb-8">
            Browse listings now, or sign in to manage properties as an agent.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-700">
              <h3 className="text-xl font-bold text-black mb-2">
                Browse Listings
              </h3>
              <p className="text-gray-600 mb-4">
                Search the latest promoted properties across the marketplace.
              </p>
              <Link
                href="/listings"
                className="inline-flex text-emerald-700 font-semibold hover:text-emerald-800"
              >
                Open Listings
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
              <h3 className="text-xl font-bold text-black mb-2">
                Agent Access
              </h3>
              <p className="text-gray-600 mb-4">
                Sign in or create an agent account to manage properties.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  className="inline-flex text-emerald-700 font-semibold hover:text-emerald-800"
                >
                  Sign In
                </Link>

                <Link
                  href="/signup"
                  className="inline-flex text-emerald-700 font-semibold hover:text-emerald-800"
                >
                  Create Agent Account
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

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
                      property.transactionType === "For Sale"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {property.transactionType}
                  </span>

                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {property.marketStatus}
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
                    <span className="font-semibold text-black">Market:</span>{" "}
                    {property.marketStatus}
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
