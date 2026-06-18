"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AlertSendButtonProps = {
  clientId: string;
  hasAlreadySentMatches?: boolean;
  previewListingIds?: string[];
  resendListingIds?: string[];
};

export default function AlertSendButton({
  clientId,
  hasAlreadySentMatches = false,
  previewListingIds = [],
  resendListingIds = [],
}: AlertSendButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function formatDiagnostics(result: {
    message?: string;
    error?: string;
    diagnostics?: {
      serverVisibleListingCount: number;
      scopedListingCount: number;
      approvedListingCount?: number;
      alertMarketListingCount?: number;
      eligibleMatchCount: number;
      previouslySentCount: number;
      unsentMatchCount?: number;
    };
  }) {
    if (!result.diagnostics) {
      return result.message ?? result.error ?? "Unable to send alert.";
    }

    return `${result.message ?? result.error ?? "No alert sent."} ${
      result.diagnostics.unsentMatchCount === 0
        ? "Review the match breakdown above for details."
        : ""
    }`;
  }

  async function handleSend(includePreviouslySent = false) {
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/client-alerts/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          includePreviouslySent,
          previewListingIds: includePreviouslySent
            ? resendListingIds
            : previewListingIds,
        }),
      });
      const result = await response.json();

      if (!response.ok || result.ok === false) {
        setError(formatDiagnostics(result));
        return;
      }

      setMessage(formatDiagnostics(result));
      router.refresh();
    } catch {
      setError("Unable to send alert.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => handleSend(false)}
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sending..." : "Send new matches"}
      </button>
      {hasAlreadySentMatches && (
        <button
          type="button"
          onClick={() => handleSend(true)}
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-emerald-700 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Resend eligible matches
        </button>
      )}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
