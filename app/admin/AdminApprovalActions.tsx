"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminApprovalActionsProps = {
  approvalStatus: string;
  listingId: string;
};

export default function AdminApprovalActions({
  approvalStatus,
  listingId,
}: AdminApprovalActionsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"approve" | "reject" | "">(
    ""
  );

  async function submitAction(action: "approve" | "reject") {
    const reason = rejectionReason.trim();

    if (action === "reject" && !reason) {
      setError("Rejection reason is required.");
      setShowRejectReason(true);
      return;
    }

    setError("");
    setLoadingAction(action);

    const response = await fetch(`/api/admin/listings/${listingId}/approval`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        rejectionReason: action === "reject" ? reason : undefined,
      }),
    });

    setLoadingAction("");

    if (!response.ok) {
      const result = await response.json();
      setError(result.error ?? "Please try again.");
      return;
    }

    setRejectionReason("");
    setShowRejectReason(false);
    router.refresh();
  }

  const canApprove = approvalStatus !== "Approved";
  const canReject = approvalStatus !== "Rejected";

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showRejectReason && canReject && (
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            Rejection Reason
          </label>
          <textarea
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            rows={3}
            className="w-full min-w-72 border border-gray-300 rounded-lg px-3 py-2 text-black"
            placeholder="Explain what the agent should fix before resubmitting."
          />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {canApprove && (
          <button
            type="button"
            onClick={() => submitAction("approve")}
            disabled={loadingAction !== ""}
            className="bg-emerald-700 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 text-white px-5 py-3 rounded-lg font-semibold transition"
          >
            {loadingAction === "approve" ? "Approving..." : "Approve"}
          </button>
        )}

        {canReject && (
          <button
            type="button"
            onClick={() =>
              showRejectReason ? submitAction("reject") : setShowRejectReason(true)
            }
            disabled={loadingAction !== ""}
            className="bg-red-600 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 text-white px-5 py-3 rounded-lg font-semibold transition"
          >
            {loadingAction === "reject"
              ? "Rejecting..."
              : showRejectReason
                ? "Confirm Reject"
                : "Reject"}
          </button>
        )}
      </div>
    </div>
  );
}
