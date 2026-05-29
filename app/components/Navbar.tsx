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

            <div className="hidden group-hover:block absolute left-0 top-full mt-0 w-72 bg-white border-2 border-emerald-700 rounded-lg shadow-xl p-5 z-50">
              <div className="flex flex-col gap-3 text-gray-700">
                <Link href="/listings?type=Residential%20Sale">
                  Residential Sale
                </Link>

                <Link href="/listings?type=Residential%20Rent">
                  Residential Rent
                </Link>

                <Link href="/listings?type=Multi-Family">
                  Multi-Family
                </Link>

                <Link href="/listings?type=Land">Land</Link>

                <Link href="/listings?type=Commercial%20Sale">
                  Commercial Sale
                </Link>

                <Link href="/listings?type=Commercial%20Rent">
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

            <div className="hidden group-hover:block absolute left-0 top-full mt-0 w-72 bg-white border-2 border-emerald-700 rounded-lg shadow-xl p-5 z-50">
              <div className="flex flex-col gap-3 text-gray-700">

                <Link href="/">
                  Contacts / Leads
                </Link>

                <Link href="/">
                  Property Inquiries
                </Link>

                <Link href="/">
                  Client Alerts
                </Link>

                <Link href="/">
                  Communication History
                </Link>

                <Link href="/">
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

          <div className="hidden group-hover:block absolute left-0 top-full mt-0 w-72 bg-white border-2 border-emerald-700 rounded-lg shadow-xl p-5 z-50">
            <div className="flex flex-col gap-3 text-gray-700">
              <Link href="/">
                Mortgage Calculator
              </Link>

              <Link href="/">
                Affordability Calculator
              </Link>

              <Link href="/">
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
              <Link href="/">Subscription</Link>
              <Link href="/">Billing</Link>
              <Link href="/">Settings</Link>
              {/* TODO: Wire logout to the real authentication system once auth is implemented. */}
              <Link href="/">Logout</Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
