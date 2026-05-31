import Link from "next/link";
import { canUseAdminFeatures, canUseAgentFeatures, getAppSession } from "@/lib/auth";

export default async function Navbar() {
  const session = await getAppSession();
  const canUseAgent = canUseAgentFeatures(session);
  const canUseAdmin = canUseAdminFeatures(session);
  const displayName =
    session.role === "public"
      ? "Account"
      : session.profile.full_name ?? session.user.email ?? "Account";

  return (
    <nav className="bg-white border-b border-emerald-600 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center gap-6">
        <Link href="/">
          <h1 className="text-2xl md:text-3xl font-bold text-black cursor-pointer">
            EthioMLS
          </h1>
        </Link>

        <div className="flex flex-wrap gap-4 md:gap-6 items-center text-sm md:text-base">
          <div className="relative group">
            <button className="text-gray-800 font-semibold hover:text-emerald-700 transition">
              Search
            </button>

            <div className="hidden group-hover:block absolute left-0 top-full mt-0 w-72 bg-white border-2 border-emerald-700 rounded-lg shadow-xl p-5 z-50">
              <div className="flex flex-col gap-3 text-gray-700">
                <Link href="/listings">Browse Listings</Link>
                <Link href="/listings">Residential Sale</Link>
                <Link href="/listings">Residential Rent</Link>
                <Link href="/listings">Land</Link>
                <Link href="/listings">Commercial</Link>
              </div>
            </div>
          </div>

          <div className="relative group">
            <button className="text-gray-800 font-semibold hover:text-emerald-700 transition">
              Listings
            </button>

            <div className="hidden group-hover:block absolute left-0 top-full mt-0 w-72 bg-white border-2 border-emerald-700 rounded-lg shadow-xl p-5 z-50">
              <div className="flex flex-col gap-3 text-gray-700">
                <Link href="/listings">Browse Listings</Link>

                {canUseAgent && (
                  <>
                    <Link href="/add-listing">Add Listing</Link>
                    <Link href="/my-listings">Manage Listings</Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {canUseAdmin && (
            <Link
              href="/admin"
              className="text-gray-800 font-semibold hover:text-emerald-700 transition"
            >
              Admin
            </Link>
          )}
        </div>

        <div className="relative group ml-auto">
          {session.role === "public" ? (
            <Link
              href="/login"
              className="border border-emerald-700 text-emerald-700 px-4 py-2 rounded-full font-semibold hover:bg-emerald-100 transition"
            >
              Sign In
            </Link>
          ) : (
            <>
              <button className="border border-emerald-700 text-emerald-700 px-4 py-2 rounded-full font-semibold hover:bg-emerald-100 transition">
                {displayName}
              </button>

              <div className="hidden group-hover:block absolute right-0 top-full mt-0 w-56 bg-white border-2 border-emerald-700 rounded-lg shadow-xl p-5 z-50">
                <div className="flex flex-col gap-3 text-gray-700">
                  <Link href="/">Dashboard</Link>
                  <Link href="/my-listings">My Listings</Link>
                  <Link href="/add-listing">Add Listing</Link>
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
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
