"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

type ListingDetailActionsProps = {
  isOwner: boolean;
  listingId: string;
  showingAllowed: boolean;
  showingUnavailableMessage: string | null;
};

export default function ListingDetailActions({
  isOwner,
  listingId,
  showingAllowed,
  showingUnavailableMessage,
}: ListingDetailActionsProps) {
  const router = useRouter();
  const [showingRequested, setShowingRequested] = useState(false);
  const [showShowingForm, setShowShowingForm] = useState(false);
  const [showingError, setShowingError] = useState("");
  const [showingLoading, setShowingLoading] = useState(false);
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

  async function handleShowingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setShowingError("");
    setShowingLoading(true);

    const response = await fetch("/api/showing-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listingId,
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        preferredDatetime: String(formData.get("preferredDatetime") ?? ""),
        message: String(formData.get("message") ?? ""),
      }),
    });

    setShowingLoading(false);

    if (!response.ok) {
      const result = await response.json();
      setShowingError(result.error ?? "Please try again.");
      return;
    }

    form.reset();
    setShowingRequested(true);
    setShowShowingForm(false);
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
        <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
          <p className="text-2xl font-bold">Showing request sent.</p>
          <p className="mt-2 text-sm">
            The listing agent has received your inquiry and can follow up using
            the contact information you provided.
          </p>
          <Link
            href="/listings"
            className="mt-5 inline-flex bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            Back to Browse Listings
          </Link>
        </div>
      )}

      {showingError && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Showing request could not be submitted.</p>
          <p className="text-sm">{showingError}</p>
        </div>
      )}

      {showShowingForm && !isOwner && showingAllowed && (
        <form
          onSubmit={handleShowingSubmit}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-black font-semibold mb-2">
                Name
              </label>
              <input
                name="name"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-black font-semibold mb-2">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-black font-semibold mb-2">
                Phone
              </label>
              <input
                name="phone"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-black font-semibold mb-2">
                Preferred Date/Time
              </label>
              <input
                name="preferredDatetime"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
                placeholder="Optional, e.g. June 12 at 3 PM"
              />
            </div>
          </div>

          <div>
            <label className="block text-black font-semibold mb-2">
              Message
            </label>
            <textarea
              name="message"
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
              placeholder="Optional notes for the agent"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={showingLoading}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              {showingLoading ? "Submitting..." : "Submit Request"}
            </button>

            <button
              type="button"
              onClick={() => setShowShowingForm(false)}
              className="border border-gray-300 hover:border-emerald-700 hover:text-emerald-700 text-black px-6 py-3 rounded-lg font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </form>
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
            {showingAllowed ? (
              <button
                type="button"
                onClick={() => setShowShowingForm(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-4 rounded-xl text-lg font-semibold transition"
              >
                Request Showing
              </button>
            ) : (
              <div className="w-full rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-yellow-900">
                <p className="font-semibold">Showings unavailable</p>
                <p className="text-sm">
                  {showingUnavailableMessage ??
                    "This listing is not accepting showing requests."}
                </p>
              </div>
            )}

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
