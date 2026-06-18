import { redirect } from "next/navigation";
import {
  canUseAgentFeatures,
  getAppSession,
} from "@/lib/auth";
import AgentProfileRequired from "@/components/AgentProfileRequired";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const session = await getAppSession();

  if (session.role === "public") {
    redirect("/login");
  }

  if (!canUseAgentFeatures(session)) {
    return <AgentProfileRequired />;
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Account
          </p>
          <h1 className="mt-2 text-3xl font-bold text-black">
            Agent Profile
          </h1>
          <p className="mt-2 text-gray-600">
            Manage the agent details used across listings, client alerts, and
            showing request confirmations.
          </p>
        </div>

        <ProfileForm profile={session.profile} />
      </div>
    </main>
  );
}
