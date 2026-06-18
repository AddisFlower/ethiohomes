import { serviceRoleSupabaseRequest } from "@/lib/supabase";

type AgentClientPreferenceRow = {
  id: string;
  name: string;
  email: string;
  alert_unsubscribed_at: string | null;
};

function cleanToken(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const token = value.trim();
  return token.length <= 120 ? token : "";
}

export async function unsubscribeClientAlertByToken(tokenValue: unknown) {
  const token = cleanToken(tokenValue);

  if (!token) {
    throw new Error("A valid alert preference link is required.");
  }

  const unsubscribedAt = new Date().toISOString();
  const rows = await serviceRoleSupabaseRequest<AgentClientPreferenceRow[]>(
    `/agent_clients?alert_unsubscribe_token=eq.${encodeURIComponent(token)}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        alert_enabled: false,
        alert_frequency: "Off",
        alert_unsubscribed_at: unsubscribedAt,
      }),
    }
  );
  const client = rows[0];

  if (!client) {
    throw new Error("Alert preference link is invalid or expired.");
  }

  return {
    clientId: client.id,
    name: client.name,
    email: client.email,
    unsubscribedAt: client.alert_unsubscribed_at ?? unsubscribedAt,
  };
}
