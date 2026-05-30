import Link from "next/link";

export default function Navbar() {
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
              Search ▾
            </button>

            {/* TODO: Replace these MVP fallback routes once category search filters are implemented. */}
            <div className="hidden group-hover:block absolute left-0 top-full mt-0 w-72 bg-white border-2 border-emerald-700 rounded-lg shadow-xl p-5 z-50">
              <div className="flex flex-col gap-3 text-gray-700">
                <Link href="/listings">
                  Residential Sale
                </Link>

                <Link href="/listings">
                  Residential Rent
                </Link>

                <Link href="/listings">
                  Multi-Family
                </Link>

                <Link href="/listings">Land</Link>

                <Link href="/listings">
                  Commercial Sale
                </Link>

                <Link href="/listings">
                  Commercial Rent
                </Link>
              </div>
            </div>
          </div>

          <div className="relative group">
            <button className="text-gray-800 font-semibold hover:text-emerald-700 transition">
              Listings ▾
            </button>

            <div className="hidden group-hover:block absolute left-0 top-full mt-0 w-72 bg-white border-2 border-emerald-700 rounded-lg shadow-xl p-5 z-50">
              <div className="flex flex-col gap-3 text-gray-700">
                <Link href="/listings">
                  Browse Listings
                </Link>

                <Link href="/add-listing">
                  Add Listing
                </Link>

                <Link href="/my-listings">
                  Manage Listings
                </Link>

                <Link href="/listings">
                  Featured Listings
                </Link>
              </div>
            </div>
          </div>

          <div className="relative group">
            <button className="text-gray-800 font-semibold hover:text-emerald-700 transition">
              Clients ▾
            </button>

            {/* TODO: Replace these MVP fallback routes once client management pages are implemented. */}
            <div className="hidden group-hover:block absolute left-0 top-full mt-0 w-72 bg-white border-2 border-emerald-700 rounded-lg shadow-xl p-5 z-50">
              <div className="flex flex-col gap-3 text-gray-700">

                <Link href="/my-listings">
                  Contacts / Leads
                </Link>

                <Link href="/my-listings">
                  Property Inquiries
                </Link>

                <Link href="/my-listings">
                  Client Alerts
                </Link>

                <Link href="/my-listings">
                  Communication History
                </Link>

                <Link href="/my-listings">
                  My Showings
                </Link>

              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          <button className="text-gray-800 font-semibold hover:text-emerald-700 transition">
            Financial ▾
          </button>

          {/* TODO: Replace these MVP fallback routes once financial tools are implemented. */}
          <div className="hidden group-hover:block absolute left-0 top-full mt-0 w-72 bg-white border-2 border-emerald-700 rounded-lg shadow-xl p-5 z-50">
            <div className="flex flex-col gap-3 text-gray-700">
              <Link href="/my-listings">
                Mortgage Calculator
              </Link>

              <Link href="/my-listings">
                Affordability Calculator
              </Link>

              <Link href="/my-listings">
                Investment Estimate
              </Link>
            </div>
          </div>
        </div>

        {/* TODO: Replace this mock agent profile with authenticated user data once auth is implemented. */}
        <div className="relative group ml-auto">
          <button className="border border-emerald-700 text-emerald-700 px-4 py-2 rounded-full font-semibold hover:bg-emerald-100 transition">
            Mac Yifru ▾
          </button>

          <div className="hidden group-hover:block absolute right-0 top-full mt-0 w-56 bg-white border-2 border-emerald-700 rounded-lg shadow-xl p-5 z-50">
            <div className="flex flex-col gap-3 text-gray-700">
              <Link href="/">Dashboard</Link>
              <Link href="/my-listings">My Listings</Link>
              {/* TODO: Replace these MVP fallback routes once account pages are implemented. */}
              <Link href="/my-listings">Subscription</Link>
              <Link href="/my-listings">Billing</Link>
              <Link href="/my-listings">Settings</Link>
              {/* TODO: Wire logout to the real authentication system once auth is implemented. */}
              <Link href="/">Logout</Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
