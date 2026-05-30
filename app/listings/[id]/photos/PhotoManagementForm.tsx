"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PhotoManagementFormProps = {
  listingId: string;
};

export default function PhotoManagementForm({
  listingId,
}: PhotoManagementFormProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setError("");
        setSaved(false);

        const response = await fetch(`/api/listings/${listingId}/photo`, {
          method: "PUT",
          body: new FormData(form),
        });

        if (!response.ok) {
          const result = await response.json();
          setError(result.error ?? "Please try again.");
          return;
        }

        form.reset();
        setSaved(true);
        router.refresh();
      }}
    >
      {saved && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
          <p className="font-semibold">Primary photo updated.</p>
          <p className="text-sm">
            The new image is now used across this listing.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Photo could not be updated.</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-black font-semibold mb-2">
          Replace Primary Photo
        </label>

        <input
          name="imageFile"
          type="file"
          accept="image/*"
          required
          className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-lg font-semibold transition"
      >
        Upload Photo
      </button>
    </form>
  );
}
