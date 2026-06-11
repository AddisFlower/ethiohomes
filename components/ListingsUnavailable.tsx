import Link from "next/link";

type ListingsUnavailableProps = {
  description?: string;
};

export default function ListingsUnavailable({
  description = "We could not load listing data right now. Please try again shortly.",
}: ListingsUnavailableProps) {
  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl border border-yellow-200 bg-white p-8 shadow-lg">
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-yellow-700">
          Service unavailable
        </p>
        <h1 className="mb-4 text-4xl font-bold text-black">
          Listings are temporarily unavailable
        </h1>
        <p className="mb-6 text-gray-600">{description}</p>
        <Link
          href="/"
          className="inline-flex rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800"
        >
          Return to Dashboard
        </Link>
      </div>
    </main>
  );
}
