import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <Link href="/">
        <h1 className="text-2xl md:text-3xl font-bold text-black cursor-pointer">
            EthioHomes
          </h1>
        </Link>

        <div className="flex gap-4 md:gap-6 items-center text-sm md:text-base">
          <Link
            href="/"
            className="text-gray-700 hover:text-black font-medium"
          >
            Home
          </Link>

          <Link
            href="/add-listing"
            className="text-gray-700 hover:text-black font-medium"
          >
            Add Listing
          </Link>

          <Link
            href="/admin"
            className="text-gray-700 hover:text-black font-medium"
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}