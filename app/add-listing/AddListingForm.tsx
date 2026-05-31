"use client";

import Link from "next/link";
import { useState } from "react";
import PropertyForm from "@/components/PropertyForm";

export default function AddListingForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  return (
    <>
      {submitted && (
        <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
          <p className="font-semibold">Listing submitted for review.</p>
          <p className="text-sm mb-4">
            Status: Pending Approval. An admin will review it before it becomes
            active.
          </p>

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
    </>
  );
}
