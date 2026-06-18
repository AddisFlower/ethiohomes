import Link from "next/link";
import UnsubscribeForm from "./UnsubscribeForm";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Listing Alerts
          </p>
          <h1 className="mt-2 text-3xl font-bold text-black">
            Alert Preferences
          </h1>
          <p className="mt-2 text-gray-600">
            Turn off listing alert emails for this saved client search.
          </p>
        </div>

        {token ? (
          <UnsubscribeForm token={token} />
        ) : (
          <div className="rounded-lg border border-red-300 bg-red-50 p-5 text-red-700">
            <p className="font-semibold">Invalid alert preference link.</p>
            <p className="mt-1 text-sm">
              The link is missing its preference token.
            </p>
          </div>
        )}

        <Link
          href="/listings"
          className="mt-6 inline-flex font-semibold text-emerald-700 hover:text-emerald-800"
        >
          Browse listings
        </Link>
      </div>
    </main>
  );
}
