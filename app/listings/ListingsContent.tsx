"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Property } from "@/lib/listings";
import {
  getShowingEligibility,
  marketStatuses,
  propertyTypes,
} from "@/lib/listing-rules";

type ListingsContentProps = {
  currentUserId: string | null;
  properties: Property[];
};

export default function ListingsContent({
  currentUserId,
  properties,
}: ListingsContentProps) {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("search") ?? ""
  );
  const [transactionType, setTransactionType] = useState(
    () => searchParams.get("transactionType") ?? "ALL"
  );
  const [marketStatus, setMarketStatus] = useState(
    () => searchParams.get("marketStatus") ?? "ALL"
  );
  const [propertyType, setPropertyType] = useState(
    () => searchParams.get("propertyType") ?? "ALL"
  );
  const [category, setCategory] = useState(
    () => searchParams.get("category") ?? "ALL"
  );
  const [showingListing, setShowingListing] = useState<Property | null>(null);
  const [showingError, setShowingError] = useState("");
  const [showingLoading, setShowingLoading] = useState(false);
  const [showingSuccessId, setShowingSuccessId] = useState<string | null>(null);

  async function handleShowingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!showingListing) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    setShowingError("");
    setShowingLoading(true);

    try {
      const response = await fetch("/api/showing-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId: showingListing.id,
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          preferredDatetime: String(
            formData.get("preferredDatetime") ?? ""
          ),
          message: String(formData.get("message") ?? ""),
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setShowingError(result.error ?? "Please try again.");
        return;
      }

      setShowingSuccessId(showingListing.id);
      setShowingListing(null);
    } finally {
      setShowingLoading(false);
    }
  }

  const filteredProperties = properties.filter((property) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      property.title.toLowerCase().includes(search) ||
      property.location.toLowerCase().includes(search);

    const matchesTransactionType =
      transactionType === "ALL" || property.transactionType === transactionType;

    const matchesMarketStatus =
      marketStatus === "ALL" || property.marketStatus === marketStatus;

    const matchesPropertyType =
      propertyType === "ALL" || property.propertyType === propertyType;
    const matchesCategory =
      category === "ALL" ||
      (category === "Residential" &&
        ["Apartment", "Villa", "House", "Condo", "Multi-Family"].includes(
          property.propertyType
        )) ||
      (category === "Commercial" &&
        ["Commercial", "Office"].includes(property.propertyType));

    return (
      matchesSearch &&
      matchesTransactionType &&
      matchesMarketStatus &&
      matchesPropertyType &&
      matchesCategory
    );
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
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
          className="bg-white text-black px-4 py-3 rounded-lg border border-gray-300 mb-8 ml-4"
        >
          <option value="ALL">All Listings</option>
          <option value="For Sale">For Sale</option>
          <option value="For Rent">For Rent</option>
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-white text-black px-4 py-3 rounded-lg border border-gray-300 mb-8 ml-4"
        >
          <option value="ALL">All Categories</option>
          <option value="Residential">Residential</option>
          <option value="Commercial">Commercial / Office</option>
        </select>

        <select
          value={marketStatus}
          onChange={(e) => setMarketStatus(e.target.value)}
          className="bg-white text-black px-4 py-3 rounded-lg border border-gray-300 mb-8 ml-4"
        >
          <option value="ALL">All Market Statuses</option>
          {marketStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="bg-white text-black px-4 py-3 rounded-lg border border-gray-300 mb-8 ml-4"
        >
          <option value="ALL">All Property Types</option>
          {propertyTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredProperties.map((property) => {
            const isOwner = currentUserId === property.ownerId;
            const showingEligibility = getShowingEligibility(property);

            return (
              <div
                key={property.id}
                className={`bg-white rounded-xl overflow-hidden shadow-lg transition duration-300 ${
                  property.approvalStatus === "Rejected"
                    ? "border-2 border-red-500"
                    : ""
                }`}
              >
                <div className="relative">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="h-56 w-full object-cover"
                  />

                  {property.approvalStatus === "Rejected" && (
                    <span className="absolute left-3 top-3 rounded-full bg-red-600 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white shadow-lg">
                      Rejected
                    </span>
                  )}
                </div>

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
                      {property.transactionType}
                    </span>

                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                      {property.marketStatus}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        property.approvalStatus === "Rejected"
                          ? "bg-red-100 text-red-700 ring-1 ring-red-300"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {property.approvalStatus}
                    </span>

                    {isOwner && (
                      <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-semibold">
                        OWNED BY YOU
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    {showingSuccessId === property.id && (
                      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900">
                        <p className="font-semibold">Showing request sent.</p>
                        <p className="text-sm">
                          The listing agent can now follow up with you.
                        </p>
                      </div>
                    )}

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
                    ) : showingEligibility.allowed ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowingError("");
                          setShowingListing(property);
                        }}
                        className="w-full border border-gray-300 hover:border-emerald-700 hover:text-emerald-700 text-black py-3 rounded-lg transition"
                      >
                        Request Showing
                      </button>
                    ) : null}
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
                setTransactionType("ALL");
                setMarketStatus("ALL");
                setPropertyType("ALL");
                setCategory("ALL");
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {showingListing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="showing-form-title"
        >
          <form
            onSubmit={handleShowingSubmit}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="showing-form-title"
                  className="text-2xl font-bold text-black"
                >
                  Request a Showing
                </h2>
                <p className="mt-1 text-gray-600">{showingListing.title}</p>
              </div>

              <button
                type="button"
                onClick={() => setShowingListing(null)}
                className="rounded-lg border border-gray-300 px-3 py-2 font-semibold text-gray-700 hover:border-gray-500"
              >
                Close
              </button>
            </div>

            {showingError && (
              <div className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
                <p className="font-semibold">
                  Showing request could not be submitted.
                </p>
                <p className="text-sm">{showingError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-semibold text-black">
                  Name
                </label>
                <input
                  name="name"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-black">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-black">
                  Phone
                </label>
                <input
                  name="phone"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-black">
                  Preferred Date/Time
                </label>
                <input
                  name="preferredDatetime"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
                  placeholder="Optional, e.g. June 12 at 3 PM"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block font-semibold text-black">
                Message
              </label>
              <textarea
                name="message"
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
                placeholder="Optional notes for the agent"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={showingLoading}
                className="rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {showingLoading ? "Submitting..." : "Submit Request"}
              </button>

              <button
                type="button"
                disabled={showingLoading}
                onClick={() => setShowingListing(null)}
                className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-black transition hover:border-emerald-700 hover:text-emerald-700 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
