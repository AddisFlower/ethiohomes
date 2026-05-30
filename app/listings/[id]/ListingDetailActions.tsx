"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ListingDetailActionsProps = {
  isOwner: boolean;
  listingId: string;
};

export default function ListingDetailActions({
  isOwner,
  listingId,
}: ListingDetailActionsProps) {
  const router = useRouter();
  const [showingRequested, setShowingRequested] = useState(false);
  const [listingSaved, setListingSaved] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (!confirmed) {
      return;
    }

    // TODO: Replace the mocked owner context with authenticated user checks.
    setDeleteError("");
    const response = await fetch(`/api/listings/${listingId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = await response.json();
      setDeleteError(result.error ?? "Please try again.");
      return;
    }

    setDeleted(true);
    window.setTimeout(() => {
      router.push("/my-listings");
    }, 1200);
  }

  if (deleted) {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
        <p className="font-semibold">Listing deleted.</p>
        <p className="text-sm">Returning to My Listings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showingRequested && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
          <p className="font-semibold">Showing request submitted.</p>
          <p className="text-sm">
            The listing agent has been notified in this MVP flow.
          </p>
        </div>
      )}

      {listingSaved && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
          <p className="font-semibold">Listing saved.</p>
          <p className="text-sm">
            This listing has been added to your saved list for this MVP flow.
          </p>
        </div>
      )}

      {deleteError && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Listing could not be deleted.</p>
          <p className="text-sm">{deleteError}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        {isOwner ? (
          <>
            <Link href={`/listings/${listingId}/edit`}>
              <button className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-4 rounded-xl text-lg font-semibold transition">
                Edit Listing
              </button>
            </Link>

            <Link href={`/listings/${listingId}/photos`}>
              <button className="border border-gray-300 hover:border-emerald-700 hover:text-emerald-700 text-black px-8 py-4 rounded-xl text-lg font-semibold transition">
                Manage Photos
              </button>
            </Link>

            <button
              type="button"
              onClick={handleDelete}
              className="border border-red-300 hover:border-red-600 hover:text-red-600 text-red-600 px-8 py-4 rounded-xl text-lg font-semibold transition"
            >
              Delete Listing
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowingRequested(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-4 rounded-xl text-lg font-semibold transition"
            >
              Request Showing
            </button>

            <button
              type="button"
              onClick={() => setListingSaved(true)}
              className="border border-gray-300 hover:border-emerald-700 hover:text-emerald-700 text-black px-8 py-4 rounded-xl text-lg font-semibold transition"
            >
              Save Listing
            </button>
          </>
        )}
      </div>
    </div>
  );
}
