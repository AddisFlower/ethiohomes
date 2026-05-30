"use client";

import type { FormEvent } from "react";

export type PropertyFormDefaultValues = {
  title?: string;
  price?: string | number;
  city?: string;
  propertyType?: string;
  listingType?: string;
  bedrooms?: string | number;
  bathrooms?: string | number;
  description?: string;
  image?: string;
};

type PropertyFormProps = {
  mode: "create" | "edit";
  defaultValues?: PropertyFormDefaultValues;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

export default function PropertyForm({
  mode,
  defaultValues,
  onSubmit,
}: PropertyFormProps) {
  const isEditMode = mode === "edit";

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
          Property Type
        </label>

        <select
          name="propertyType"
          defaultValue={defaultValues?.propertyType ?? "Apartment"}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
        >
          <option>Apartment</option>
          <option>Villa</option>
          <option>House</option>
          <option>Land</option>
          <option>Commercial</option>
        </select>
      </div>

      <div>
        <label className="block text-black font-semibold mb-2">
          Listing Type
        </label>

        <select
          name="listingType"
          required
          defaultValue={defaultValues?.listingType ?? "FOR SALE"}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
        >
          <option>FOR SALE</option>
          <option>FOR RENT</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-black font-semibold mb-2">
            Bedrooms
          </label>

          <input
            name="bedrooms"
            type="number"
            placeholder="3"
            defaultValue={defaultValues?.bedrooms}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black"
            required
            min={1}
          />
        </div>

        <div>
          <label className="block text-black font-semibold mb-2">
            Bathrooms
          </label>

          <input
            name="bathrooms"
            type="number"
            placeholder="2"
            defaultValue={defaultValues?.bathrooms}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black"
            required
            min={1}
          />
        </div>
      </div>

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
        <div>
          <label className="block text-black font-semibold mb-2">
            Property Image URL
          </label>

          <input
            name="image"
            type="url"
            required
            defaultValue={defaultValues?.image}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black"
          />

          <p className="text-sm text-gray-500 mt-2">
            Current property image used for this listing.
          </p>
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

      <button
        type="submit"
        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-lg font-semibold transition"
      >
        {isEditMode ? "Save Listing" : "Submit Listing"}
      </button>
    </form>
  );
}
