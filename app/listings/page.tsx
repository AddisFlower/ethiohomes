import { Suspense } from "react";
import { canUseAgentFeatures, getAppSession } from "@/lib/auth";
import { getListingsForViewer } from "@/lib/listings";
import ListingsContent from "./ListingsContent";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAppSession();
  const currentSearchParams = await searchParams;
  const currentUserId = canUseAgentFeatures(session) ? session.user.id : null;
  const properties = await getListingsForViewer(
    session.role,
    currentUserId ?? undefined
  );
  const filterKey = JSON.stringify(currentSearchParams);

  return (
    <Suspense>
      <ListingsContent
        key={filterKey}
        properties={properties}
        currentUserId={currentUserId}
      />
    </Suspense>
  );
}
