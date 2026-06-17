"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import type { AgentClient } from "@/lib/clients";
import {
  alertFrequencies,
  alertMarketStatuses,
  clientStatuses,
} from "@/lib/clients";
import {
  marketStatuses,
  propertyTypes,
  transactionTypes,
} from "@/lib/listing-rules";

type ClientFormProps = {
  client?: AgentClient;
  defaultValues?: Partial<AgentClient>;
  mode: "create" | "edit";
};

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function ClientForm({
  client,
  defaultValues,
  mode,
}: ClientFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        mode === "create" ? "/api/clients" : `/api/clients/${client?.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Please try again.");
        return;
      }

      router.push(`/clients/${result.client.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Client could not be saved.</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <fieldset disabled={loading} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-semibold text-black">
              Client Name
            </label>
            <input
              name="name"
              required
              defaultValue={client?.name ?? defaultValues?.name}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold text-black">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              defaultValue={client?.email ?? defaultValues?.email}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
              placeholder="client@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold text-black">
              Phone
            </label>
            <input
              name="phone"
              defaultValue={client?.phone ?? defaultValues?.phone ?? ""}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold text-black">
              Source
            </label>
            <input
              name="source"
              defaultValue={client?.source ?? defaultValues?.source ?? "Manual"}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
              placeholder="Manual, Referral, Showing Request"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold text-black">
              Status
            </label>
            <select
              name="status"
              required
              defaultValue={client?.status ?? defaultValues?.status ?? "New"}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
            >
              {clientStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-semibold text-black">
              Next Follow-up
            </label>
            <input
              name="nextFollowUpAt"
              type="datetime-local"
              defaultValue={toDateTimeLocal(
                client?.nextFollowUpAt ?? defaultValues?.nextFollowUpAt
              )}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block font-semibold text-black">Notes</label>
          <textarea
            name="notes"
            rows={4}
            defaultValue={client?.notes ?? defaultValues?.notes ?? ""}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
            placeholder="Outreach notes, preferences, objections, or next steps"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h2 className="mb-4 text-xl font-bold text-black">
            Saved Criteria
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-semibold text-black">
                Location
              </label>
              <input
                name="preferredLocation"
                defaultValue={
                  client?.preferredLocation ??
                  defaultValues?.preferredLocation ??
                  ""
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
                placeholder="City, neighborhood, or address text"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold text-black">
                Property Type
              </label>
              <select
                name="preferredPropertyType"
                defaultValue={
                  client?.preferredPropertyType ??
                  defaultValues?.preferredPropertyType ??
                  ""
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
              >
                <option value="">Any</option>
                {propertyTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-semibold text-black">
                Transaction Type
              </label>
              <select
                name="preferredTransactionType"
                defaultValue={
                  client?.preferredTransactionType ??
                  defaultValues?.preferredTransactionType ??
                  ""
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
              >
                <option value="">Any</option>
                {transactionTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-semibold text-black">
                Market Status
              </label>
              <select
                name="preferredMarketStatus"
                defaultValue={
                  client?.preferredMarketStatus ??
                  defaultValues?.preferredMarketStatus ??
                  ""
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
              >
                <option value="">Any</option>
                {marketStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-semibold text-black">
                Minimum Price
              </label>
              <input
                name="minPrice"
                type="number"
                min={0}
                defaultValue={client?.minPrice ?? defaultValues?.minPrice ?? ""}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold text-black">
                Maximum Price
              </label>
              <input
                name="maxPrice"
                type="number"
                min={0}
                defaultValue={client?.maxPrice ?? defaultValues?.maxPrice ?? ""}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold text-black">
                Minimum Bedrooms
              </label>
              <input
                name="minBedrooms"
                type="number"
                min={0}
                defaultValue={
                  client?.minBedrooms ?? defaultValues?.minBedrooms ?? ""
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold text-black">
                Minimum Bathrooms
              </label>
              <input
                name="minBathrooms"
                type="number"
                min={0}
                defaultValue={
                  client?.minBathrooms ?? defaultValues?.minBathrooms ?? ""
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
              />
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 block font-semibold text-black">
              Alert Market Statuses
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {alertMarketStatuses.map((status) => {
                const selectedStatuses =
                  client?.alertMarketStatuses ??
                  defaultValues?.alertMarketStatuses ??
                  ["Active"];

                return (
                  <label
                    key={status}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-black"
                  >
                    <input
                      name="alertMarketStatuses"
                      type="checkbox"
                      value={status}
                      defaultChecked={selectedStatuses.includes(status)}
                      className="h-5 w-5"
                    />
                    {status}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-xl font-bold text-black">
            Automated Alert Prep
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-black">
              <input
                name="alertEnabled"
                type="checkbox"
                defaultChecked={
                  client?.alertEnabled ?? defaultValues?.alertEnabled ?? false
                }
                className="h-5 w-5"
              />
              Enable saved alert criteria
            </label>

            <div>
              <label className="mb-2 block font-semibold text-black">
                Frequency
              </label>
              <select
                name="alertFrequency"
                defaultValue={
                  client?.alertFrequency ??
                  defaultValues?.alertFrequency ??
                  "Immediate"
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
              >
                {alertFrequencies.map((frequency) => (
                  <option key={frequency}>{frequency}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : mode === "create"
              ? "Add Client"
              : "Save Client"}
        </button>
      </fieldset>
    </form>
  );
}
