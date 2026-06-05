"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import PropertyForm from "@/components/PropertyForm";

export default function AddListingForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInFlight = useRef(false);

  return (
    <>
      {submitted && (
        <div className="mb-8 rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
          <p className="text-2xl font-bold">Listing submitted for review.</p>
          <p className="mt-2 text-sm mb-5">
            Status: Unapproved. An admin will review it before it becomes
            active.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/my-listings"
              className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              View My Listings
            </Link>

            <Link
              href="/"
              className="inline-block border border-emerald-700 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg font-semibold transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Listing could not be submitted.</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <PropertyForm
        disabled={isSubmitting || submitted}
        mode="create"
        submitLabel={
          isSubmitting
            ? "Submitting..."
            : submitted
              ? "Submitted"
              : "Submit Listing"
        }
        onSubmit={async (e) => {
          e.preventDefault();

          if (submissionInFlight.current || submitted) {
            return;
          }

          const form = e.currentTarget;
          setError("");
          setIsSubmitting(true);
          submissionInFlight.current = true;

          try {
            const response = await fetch("/api/listings", {
              method: "POST",
              body: new FormData(form),
            });

            if (!response.ok) {
              const result = await response.json();
              setError(result.error ?? "Please try again.");
              submissionInFlight.current = false;
              return;
            }

            setSubmitted(true);
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    </>
  );
}
