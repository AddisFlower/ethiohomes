"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PropertyForm, {
  type PropertyFormDefaultValues,
} from "@/components/PropertyForm";

type EditListingFormProps = {
  approvalStatus: string;
  listingId: string;
  rejectionReason: string | null;
  defaultValues: PropertyFormDefaultValues;
};

export default function EditListingForm({
  approvalStatus,
  listingId,
  rejectionReason,
  defaultValues,
}: EditListingFormProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const isRejected = approvalStatus === "Rejected";

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (!confirmed) {
      return;
    }

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

  return (
    <>
      {isRejected && rejectionReason && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Listing rejected.</p>
          <p className="text-sm">{rejectionReason}</p>
          <p className="text-sm mt-2">
            Saving changes will resubmit this listing for admin review.
          </p>
        </div>
      )}

      {saved && (
        <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
          <p className="font-semibold">
            {isRejected ? "Listing resubmitted for review." : "Listing changes saved."}
          </p>
          <p className="text-sm mb-4">
            {isRejected
              ? "Status: Unapproved. The rejection reason has been cleared."
              : "Your listing changes have been saved."}
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

      {deleteError && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Listing could not be deleted.</p>
          <p className="text-sm">{deleteError}</p>
        </div>
      )}

      {deleted && (
        <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
          <p className="font-semibold">Listing deleted.</p>
          <p className="text-sm">Returning to My Listings...</p>
        </div>
      )}

      <PropertyForm
        disabled={isSubmitting || saved || deleted}
        actionSlot={
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting || saved || deleted}
            className="w-full border border-red-300 hover:border-red-600 hover:text-red-600 text-red-600 py-3 rounded-lg font-semibold transition"
          >
            Delete Listing
          </button>
        }
        mode="edit"
        defaultValues={defaultValues}
        photoManagementHref={`/listings/${listingId}/photos`}
        submitLabel={
          isSubmitting ? "Saving..." : saved ? "Saved" : "Save Listing"
        }
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;

          setError("");
          setSaved(false);
          setIsSubmitting(true);

          try {
            const response = await fetch(`/api/listings/${listingId}`, {
              method: "PUT",
              body: new FormData(form),
            });

            if (!response.ok) {
              const result = await response.json();
              setError(result.error ?? "Please try again.");
              return;
            }

            setSaved(true);
            router.refresh();
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    </>
  );
}
