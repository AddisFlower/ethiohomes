"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  createMarketStatuses,
  getPropertyFieldRules,
  marketStatuses,
  propertyTypes,
  transactionTypes,
} from "@/lib/listing-rules";

export type PropertyFormDefaultValues = {
  title?: string;
  price?: string | number;
  city?: string;
  address?: string;
  propertyType?: string;
  transactionType?: string;
  marketStatus?: string;
  bedrooms?: string | number;
  bathrooms?: string | number;
  description?: string;
  image?: string;
};

type PropertyFormProps = {
  actionSlot?: ReactNode;
  mode: "create" | "edit";
  defaultValues?: PropertyFormDefaultValues;
  disabled?: boolean;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  photoManagementHref?: string;
  submitLabel?: string;
};

export default function PropertyForm({
  actionSlot,
  mode,
  defaultValues,
  disabled = false,
  onSubmit,
  photoManagementHref,
  submitLabel,
}: PropertyFormProps) {
  const isEditMode = mode === "edit";
  const defaultSubmitLabel = isEditMode ? "Save Listing" : "Submit Listing";
  const [propertyType, setPropertyType] = useState(
    defaultValues?.propertyType ?? "Apartment"
  );
  const [bedrooms, setBedrooms] = useState(
    defaultValues?.bedrooms?.toString() ?? ""
  );
  const [bathrooms, setBathrooms] = useState(
    defaultValues?.bathrooms?.toString() ?? ""
  );
  const fieldRules = getPropertyFieldRules(propertyType);
  const availableMarketStatuses = isEditMode
    ? marketStatuses
    : createMarketStatuses;

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        if (onSubmit) {
          onSubmit(event);
          return;
        }

        event.preventDefault();
      }}
    >
      <fieldset disabled={disabled} className="space-y-6">
        <div>
          <label className="block text-black font-semibold mb-2">
            Property Title
          </label>

        <input
          name="title"
          type="text"
          required
          placeholder="Modern Apartment in Bole"
          defaultValue={defaultValues?.title}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
        />
        </div>

      <div>
        <label className="block text-black font-semibold mb-2">
          Price (ETB)
        </label>

        <input
          name="price"
          type="number"
          placeholder="12000000"
          defaultValue={defaultValues?.price}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
          required
          min={1}
        />
      </div>

      <div>
        <label className="block text-black font-semibold mb-2">City</label>

        <select
          name="city"
          required
          defaultValue={defaultValues?.city ?? "Addis Ababa"}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
        >
          <option>Addis Ababa</option>
          <option>Adama</option>
          <option>Hawassa</option>
          <option>Bahir Dar</option>
        </select>
      </div>

      <div>
        <label className="block text-black font-semibold mb-2">
          Property Address
        </label>

        <input
          name="address"
          type="text"
          required
          placeholder="Bole Rwanda Embassy Area, House No. B-214"
          defaultValue={defaultValues?.address}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
        />

        <p className="text-sm text-gray-500 mt-2">
          Use the street, building, compound, or landmark-level address.
        </p>
      </div>

      <div>
        <label className="block text-black font-semibold mb-2">
          Property Type
        </label>

        <select
          name="propertyType"
          value={propertyType}
          onChange={(event) => {
            const nextPropertyType = event.target.value;
            const nextRules = getPropertyFieldRules(nextPropertyType);

            setPropertyType(nextPropertyType);

            if (!nextRules.showBedrooms) {
              setBedrooms("");
            }

            if (!nextRules.showBathrooms) {
              setBathrooms("");
            }
          }}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
        >
          {propertyTypes.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-black font-semibold mb-2">
          Transaction Type
        </label>

        <select
          name="transactionType"
          required
          defaultValue={defaultValues?.transactionType ?? "For Sale"}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
        >
          {transactionTypes.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-black font-semibold mb-2">
          Market Status
        </label>

        <select
          name="marketStatus"
          required
          defaultValue={defaultValues?.marketStatus ?? "Active"}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
        >
          {availableMarketStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </div>

      {(fieldRules.showBedrooms || fieldRules.showBathrooms) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fieldRules.showBedrooms && (
            <div>
              <label className="block text-black font-semibold mb-2">
                Bedrooms
              </label>

              <input
                name="bedrooms"
                type="number"
                placeholder="3"
                value={bedrooms}
                onChange={(event) => setBedrooms(event.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black"
                required={fieldRules.bedroomsRequired}
                min={0}
              />
            </div>
          )}

          {fieldRules.showBathrooms && (
            <div>
              <label className="block text-black font-semibold mb-2">
                Bathrooms{fieldRules.bathroomsRequired ? "" : " (Optional)"}
              </label>

              <input
                name="bathrooms"
                type="number"
                placeholder="2"
                value={bathrooms}
                onChange={(event) => setBathrooms(event.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black"
                required={fieldRules.bathroomsRequired}
                min={0}
              />
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-black font-semibold mb-2">
          Description
        </label>

        <textarea
          name="description"
          required
          rows={5}
          placeholder="Describe the property..."
          defaultValue={defaultValues?.description}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
        />
      </div>

      {isEditMode ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="font-semibold text-black">Primary Property Image</p>
          {defaultValues?.image && (
            <img
              src={defaultValues.image}
              alt="Current listing"
              className="mt-3 h-48 w-full rounded-lg object-cover"
            />
          )}
          <p className="text-sm text-gray-600 mt-3">
            Photo changes use file upload through Manage Photos.
          </p>
          {photoManagementHref && (
            <Link
              href={photoManagementHref}
              className="mt-3 inline-flex font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Manage Photos
            </Link>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-black font-semibold mb-2">
            Primary Property Image
          </label>

          <input
            name="imageFile"
            type="file"
            accept="image/*"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white"
          />

          <p className="text-sm text-gray-500 mt-2">
            Upload one high-quality photo for this listing.
          </p>
        </div>
      )}

      <div
        className={
          actionSlot ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : undefined
        }
      >
        <button
          type="submit"
          disabled={disabled}
          className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 text-white py-3 rounded-lg font-semibold transition"
        >
          {submitLabel ?? defaultSubmitLabel}
        </button>

        {actionSlot}
      </div>
      </fieldset>
    </form>
  );
}
