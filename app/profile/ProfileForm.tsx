"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Profile } from "@/lib/auth";

type ProfileFormProps = {
  profile: Profile;
};

export default function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");
    setSaved(false);
    setLoading(true);

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agencyName: String(formData.get("agencyName") ?? ""),
        fullName: String(formData.get("fullName") ?? ""),
        publicContactEmail: String(formData.get("publicContactEmail") ?? ""),
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const result = await response.json();
      setError(result.error ?? "Please try again.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg bg-white p-6 shadow-sm"
    >
      {error && (
        <div className="mb-5 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Profile could not be saved.</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {saved && (
        <div className="mb-5 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
          <p className="font-semibold">Profile saved.</p>
          <p className="text-sm">
            Public showing confirmations now use this contact email when set.
          </p>
        </div>
      )}

      <div className="grid gap-5">
        <div>
          <label className="mb-2 block font-semibold text-black">
            Full Name
          </label>
          <input
            name="fullName"
            defaultValue={profile.full_name ?? ""}
            maxLength={120}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
            placeholder="Agent name"
          />
        </div>

        <div>
          <label className="mb-2 block font-semibold text-black">
            Agency Name
          </label>
          <input
            name="agencyName"
            defaultValue={profile.agency_name ?? ""}
            maxLength={160}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
            placeholder="Agency or brokerage"
          />
        </div>

        <div>
          <label className="mb-2 block font-semibold text-black">
            Public Contact Email
          </label>
          <input
            name="publicContactEmail"
            type="email"
            defaultValue={profile.public_contact_email ?? ""}
            maxLength={254}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
            placeholder="contact@example.com"
          />
          <p className="mt-2 text-sm text-gray-600">
            This email can be shown after successful showing requests. Leave it
            blank to avoid displaying a direct contact email.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
