"use client";

import { useState } from "react";
import Link from "next/link";
import PropertyForm from "@/components/PropertyForm";


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
              <Link
                href="/listings"
                className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                View My Listings
              </Link>
            </div>
          )}

          <PropertyForm
            mode="create"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          />
        </div>
      </main>
    );
  }
