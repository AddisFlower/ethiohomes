"use client";

import Link from "next/link";
import { useState } from "react";
import PropertyForm, {
  type PropertyFormDefaultValues,
} from "@/components/PropertyForm";

type EditListingFormProps = {
  listingId: string;
  defaultValues: PropertyFormDefaultValues;
};

export default function EditListingForm({
  listingId,
  defaultValues,
}: EditListingFormProps) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  return (
    <>
      {saved && (
        <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
          <p className="font-semibold">Listing changes saved.</p>
          {/* TODO: Persist edited listing values once database storage is implemented. */}
          <p className="text-sm mb-4">
            This mock MVP keeps changes in the browser for now. Database
            persistence will be added after auth and storage are introduced.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/listings/${listingId}`}
              className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              View Listing
            </Link>

            <Link
              href="/my-listings"
              className="inline-block border border-emerald-700 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg font-semibold transition"
            >
              My Listings
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Listing changes could not be saved.</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <PropertyForm
        mode="edit"
        defaultValues={defaultValues}
        onSubmit={async (event) => {
          event.preventDefault();

          setError("");

          const response = await fetch(`/api/listings/${listingId}`, {
            method: "PUT",
            body: new FormData(event.currentTarget),
          });

          if (!response.ok) {
            const result = await response.json();
            setError(result.error ?? "Please try again.");
            return;
          }

          setSaved(true);
        }}
      />
    </>
  );
}
