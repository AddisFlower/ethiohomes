"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AlertSendButtonProps = {
  clientId: string;
};

export default function AlertSendButton({ clientId }: AlertSendButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/client-alerts/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientId }),
      });
      const result = await response.json();

      if (!response.ok || result.ok === false) {
        setError(result.message ?? result.error ?? "Unable to send alert.");
        return;
      }

      setMessage(result.message ?? "Alert sent.");
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
        onClick={handleSend}
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sending..." : "Send now"}
      </button>
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
