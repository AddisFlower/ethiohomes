"use client";

import type { FormEvent } from "react";
import { useState } from "react";

type SellLeadFormProps = {
  initialAddress: string;
};

export default function SellLeadForm({ initialAddress }: SellLeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/seller-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyAddress: String(formData.get("propertyAddress") ?? ""),
          propertyType: String(formData.get("propertyType") ?? ""),
          intent: String(formData.get("intent") ?? ""),
          sellerName: String(formData.get("sellerName") ?? ""),
          sellerPhone: String(formData.get("sellerPhone") ?? ""),
          sellerEmail: String(formData.get("sellerEmail") ?? ""),
          preferredContactMethod: String(
            formData.get("preferredContactMethod") ?? ""
          ),
          notes: String(formData.get("notes") ?? ""),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Unable to submit seller request.");
        return;
      }

      form.reset();
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-md">
        <h2 className="mb-3 text-2xl font-bold text-black">
          Seller request received
        </h2>
        <p className="text-gray-700">
          We saved your property information. An EthioMLS agent can review the
          request and follow up using the contact details you provided.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-8 shadow-md">
      {error && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block font-semibold text-black">
            Property address or neighborhood
          </label>
          <input
            name="propertyAddress"
            required
            defaultValue={initialAddress}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
            placeholder="Bole, Addis Ababa"
          />
        </div>

        <div>
          <label className="mb-2 block font-semibold text-black">
            Property type
          </label>
          <select
            name="propertyType"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black"
            defaultValue=""
          >
            <option value="">Select one</option>
            <option value="Apartment">Apartment</option>
            <option value="Villa">Villa</option>
            <option value="House">House</option>
            <option value="Condo">Condo</option>
            <option value="Land">Land</option>
            <option value="Commercial">Commercial</option>
            <option value="Office">Office</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block font-semibold text-black">
            Selling goal
          </label>
          <select
            name="intent"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black"
            defaultValue="Sell"
          >
            <option value="Sell">Sell</option>
            <option value="Rent">Rent out</option>
            <option value="Unsure">Not sure yet</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block font-semibold text-black">Name</label>
          <input
            name="sellerName"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="mb-2 block font-semibold text-black">
            Phone / WhatsApp / Telegram
          </label>
          <input
            name="sellerPhone"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
            placeholder="+251..."
          />
        </div>

        <div>
          <label className="mb-2 block font-semibold text-black">
            Email optional
          </label>
          <input
            name="sellerEmail"
            type="email"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-2 block font-semibold text-black">
            Preferred contact method
          </label>
          <select
            name="preferredContactMethod"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black"
            defaultValue=""
          >
            <option value="">No preference</option>
            <option value="Phone">Phone</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Telegram">Telegram</option>
            <option value="Email">Email</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block font-semibold text-black">
            Notes optional
          </label>
          <textarea
            name="notes"
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
            placeholder="Anything agents should know about the property."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit Seller Request"}
      </button>
    </form>
  );
}
