"use client";

import { useState } from "react";

type UnsubscribeFormProps = {
  token: string;
};

export default function UnsubscribeForm({ token }: UnsubscribeFormProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleUnsubscribe() {
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/client-alerts/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Unable to update alert preferences.");
        return;
      }

      setDone(true);
      setMessage("Listing alerts have been turned off.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      {message && (
        <div className="mb-5 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
          <p className="font-semibold">Preference updated.</p>
          <p className="text-sm">{message}</p>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Preference could not be updated.</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleUnsubscribe}
        disabled={loading || done || !token}
        className="w-full rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Updating..." : "Turn Off Listing Alerts"}
      </button>
    </div>
  );
}
