"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AssignableAgent } from "@/lib/seller-leads";

type SellerLeadAssignmentFormProps = {
  agents: AssignableAgent[];
  currentAgentId: string | null;
  leadId: string;
};

export default function SellerLeadAssignmentForm({
  agents,
  currentAgentId,
  leadId,
}: SellerLeadAssignmentFormProps) {
  const router = useRouter();
  const [agentId, setAgentId] = useState(currentAgentId ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function assignLead() {
    if (!agentId) {
      setError("Choose an agent.");
      return;
    }

    setError("");
    setLoading(true);

    const response = await fetch(
      `/api/admin/seller-leads/${leadId}/assignment`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agentId }),
      }
    );

    setLoading(false);

    if (!response.ok) {
      const result = await response.json();
      setError(result.error ?? "Unable to assign seller lead.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <label className="block text-sm font-semibold text-black">
        Assign to agent
      </label>
      <select
        value={agentId}
        onChange={(event) => setAgentId(event.target.value)}
        className="w-full min-w-72 rounded-lg border border-gray-300 bg-white px-3 py-3 text-black"
      >
        <option value="">Select an agent</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
            {agent.agencyName ? ` - ${agent.agencyName}` : ""}
            {agent.role === "admin" ? " (admin)" : ""}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={assignLead}
        disabled={loading || agents.length === 0}
        className="w-full rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Assigning..." : currentAgentId ? "Update Assignment" : "Assign Lead"}
      </button>
    </div>
  );
}
