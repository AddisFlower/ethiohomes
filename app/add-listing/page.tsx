"use client";

import { useState } from "react";
import Link from "next/link";
import PropertyForm from "@/components/PropertyForm";


export default function AddListingPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

    return (
      <main className="min-h-screen bg-gray-100 py-12 px-6">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
          <h1 className="text-4xl font-bold text-black mb-8">
            Submit Property Listing
          </h1>

          {submitted && (
            <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
              <p className="font-semibold">Listing submitted for review.</p>
              <p className="text-sm">
                Status: Pending Approval. An admin will review it before it becomes active.
              </p>
              {/* TODO: Persist submitted listings once database storage is implemented. */}
              
              <Link
                href="/my-listings"
                className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                View My Listings
              </Link>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
              <p className="font-semibold">Listing could not be submitted.</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <PropertyForm
            mode="create"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              setError("");

              const response = await fetch("/api/listings", {
                method: "POST",
                body: new FormData(form),
              });

              if (!response.ok) {
                const result = await response.json();
                setError(result.error ?? "Please try again.");
                return;
              }

              setSubmitted(true);
            }}
          />
        </div>
      </main>
    );
  }
