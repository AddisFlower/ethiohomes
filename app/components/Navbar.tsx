import Link from "next/link";
import {
  canUseAdminFeatures,
  canUseAgentFeatures,
  getAppSession,
  isAuthenticated,
} from "@/lib/auth";

export default async function Navbar() {
  const session = await getAppSession();
  const canUseAgent = canUseAgentFeatures(session);
  const canUseAdmin = canUseAdminFeatures(session);
  const displayName =
    session.role === "public"
      ? "Account"
      : session.profile?.full_name ?? session.user.email ?? "Account";

  return (
    <nav className="bg-white border-b border-emerald-600 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center gap-6">
        <Link href="/">
          <h1 className="text-2xl md:text-3xl font-bold text-black cursor-pointer">
            EthioMLS
          </h1>
        </Link>

        <div className="flex flex-wrap gap-4 md:gap-6 items-center text-sm md:text-base">
          <details className="relative group">
            <summary className="list-none cursor-pointer text-gray-800 font-semibold hover:text-emerald-700 transition [&::-webkit-details-marker]:hidden">
              Search
            </summary>

            <div className="hidden group-open:block group-hover:block absolute left-0 top-full mt-0 w-72 max-w-[calc(100vw-2rem)] bg-white border-2 border-emerald-700 rounded-lg shadow-xl p-5 z-50">
              <div className="flex flex-col gap-3 text-gray-700">
                <Link href="/listings?category=Residential&transactionType=For%20Sale">
                  Residential Sale
                </Link>
                <Link href="/listings?category=Residential&transactionType=For%20Rent">
                  Residential Rent
                </Link>
                <Link href="/listings?propertyType=Land">Land</Link>
                <Link href="/listings?category=Commercial">Commercial</Link>
              </div>
            </div>
          </details>

          <details className="relative group">
            <summary className="list-none cursor-pointer text-gray-800 font-semibold hover:text-emerald-700 transition [&::-webkit-details-marker]:hidden">
              Listings
            </summary>

            <div className="hidden group-open:block group-hover:block absolute left-0 top-full mt-0 w-72 max-w-[calc(100vw-2rem)] bg-white border-2 border-emerald-700 rounded-lg shadow-xl p-5 z-50">
              <div className="flex flex-col gap-3 text-gray-700">
                <Link href="/listings">Browse Listings</Link>

                {canUseAgent && (
                  <>
                    <Link href="/add-listing">Add Listing</Link>
                    <Link href="/my-listings">Manage Listings</Link>
                    <Link href="/showing-requests">Showing Requests</Link>
                  </>
                )}
              </div>
            </div>
          </details>

          {canUseAdmin && (
            <Link
              href="/admin"
              className="text-gray-800 font-semibold hover:text-emerald-700 transition"
            >
              Admin
            </Link>
          )}
        </div>

        <div className="relative group md:ml-auto">
          {!isAuthenticated(session) ? (
            <Link
              href="/login"
              className="border border-emerald-700 text-emerald-700 px-4 py-2 rounded-full font-semibold hover:bg-emerald-100 transition"
            >
              Sign In
            </Link>
          ) : (
            <details className="relative group">
              <summary className="list-none cursor-pointer border border-emerald-700 text-emerald-700 px-4 py-2 rounded-full font-semibold hover:bg-emerald-100 transition [&::-webkit-details-marker]:hidden">
                {displayName}
              </summary>

              <div className="hidden group-open:block group-hover:block absolute left-0 md:left-auto md:right-0 top-full mt-0 w-56 max-w-[calc(100vw-2rem)] bg-white border-2 border-emerald-700 rounded-lg shadow-xl p-5 z-50">
                <div className="flex flex-col gap-3 text-gray-700">
                  <Link href="/">Dashboard</Link>
                  {canUseAgent && (
                    <>
                      <Link href="/my-listings">My Listings</Link>
                      <Link href="/showing-requests">Showing Requests</Link>
                      <Link href="/add-listing">Add Listing</Link>
                    </>
                  )}
                  {canUseAdmin && <Link href="/admin">Admin Review</Link>}
                  <form action="/api/auth/logout" method="post">
                    <button
                      type="submit"
                      className="text-left hover:text-emerald-700"
                    >
                      Logout
                    </button>
                  </form>
                </div>
              </div>
            </details>
          )}
        </div>
      </div>
    </nav>
  );
}
