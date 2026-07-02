import SellLeadForm from "@/app/sell/SellLeadForm";

type SellPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getAddressParam(
  searchParams: Record<string, string | string[] | undefined>
) {
  const address = searchParams.address;

  if (Array.isArray(address)) {
    return address[0] ?? "";
  }

  return address ?? "";
}

export default async function SellPage({ searchParams }: SellPageProps) {
  const currentSearchParams = await searchParams;
  const initialAddress = getAddressParam(currentSearchParams);

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-emerald-700">
            Sell with EthioMLS
          </p>
          <h1 className="mb-4 text-4xl font-bold text-black">
            Get matched with a local agent
          </h1>
          <p className="max-w-2xl text-gray-700">
            Tell us about the property you want to sell or rent out. This
            creates a private seller lead for agent follow-up, not a public
            listing.
          </p>
        </div>

        <SellLeadForm initialAddress={initialAddress} />
      </section>
    </main>
  );
}
