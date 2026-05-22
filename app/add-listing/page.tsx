"use client";

import { useState } from "react";


export default function AddListingPage() {
  const [submitted, setSubmitted] = useState(false);

    return (
      <main className="min-h-screen bg-gray-100 py-12 px-6">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
          <h1 className="text-4xl font-bold text-black mb-8">
            Submit Property Listing
          </h1>

          {submitted && (
            <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
              <p className="font-semibold">Listing submitted for review.</p>
              <p className="text-sm">
                Status: Pending Approval. An admin will review it before it becomes active.
              </p>
              
              {/* Later this will route to /my-listings 
                  and show only listings owned by the current agent */}
              <a
                href="/listings"
                className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                View My Listings
              </a>
            </div>
          )}

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <div>
              <label className="block text-black font-semibold mb-2">
                Property Title
              </label>
  
              <input
                type="text"
                required
                placeholder="Modern Apartment in Bole"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
              />
            </div>
  
            <div>
              <label className="block text-black font-semibold mb-2">
                Price (ETB)
              </label>
  
              <input
                type="number"
                placeholder="12000000"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
                required
                min={1}
              />
            </div>
  
            <div>
              <label className="block text-black font-semibold mb-2">
                City
              </label>
  
              <select required className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black">
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
  
              <select className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black">
                <option>Apartment</option>
                <option>Villa</option>
                <option>Land</option>
                <option>Commercial</option>
              </select>
            </div>

            <div>
              <label className="block text-black font-semibold mb-2">
                Listing Type
              </label>

              <select required className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black">
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
                  type="number"
                  placeholder="3"
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
                  type="number"
                  placeholder="2"
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
                required
                rows={5}
                placeholder="Describe the property..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
              />
            </div>

            <div>
              <label className="block text-black font-semibold mb-2">
                Property Images
              </label>

              <input
                type="file"
                multiple
                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white"
                required
              />

              <p className="text-sm text-gray-500 mt-2">
                Upload high-quality property photos.
              </p>
            </div>
  
            <button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-lg font-semibold transition"
            >
              Submit Listing
            </button>
          </form>
        </div>
      </main>
    );
  }