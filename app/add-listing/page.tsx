import { redirect } from "next/navigation";
import { canUseAgentFeatures, getAppSession } from "@/lib/auth";
import AddListingForm from "./AddListingForm";

export default async function AddListingPage() {
  const session = await getAppSession();

  if (!canUseAgentFeatures(session)) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-4xl font-bold text-black mb-8">
          Submit Property Listing
        </h1>

        <AddListingForm />
      </div>
    </main>
  );
}
