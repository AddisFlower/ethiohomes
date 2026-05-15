import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/">
          <h1 className="text-2xl font-bold text-black cursor-pointer">
            EthioHomes
          </h1>
        </Link>

        <div className="flex gap-6 items-center">
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