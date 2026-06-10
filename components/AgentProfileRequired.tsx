import Link from "next/link";

export default function AgentProfileRequired() {
  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-4xl font-bold text-black mb-4">
          Agent profile required
        </h1>

        <p className="text-gray-600 mb-6">
          Your account is signed in, but it does not have an active EthioMLS
          agent profile. Listing management and agent tools are unavailable.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/listings"
            className="inline-flex bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 rounded-lg font-semibold transition"
          >
            Browse Listings
          </Link>

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="border border-gray-300 hover:border-emerald-700 hover:text-emerald-700 text-black px-5 py-3 rounded-lg font-semibold transition"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
