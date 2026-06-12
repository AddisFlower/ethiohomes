import { Suspense } from "react";
import { canUseAgentFeatures, getAppSession } from "@/lib/auth";
import {
  getListingsForViewer,
  isListingReadError,
} from "@/lib/listings";
import ListingsUnavailable from "@/components/ListingsUnavailable";
import ListingsContent from "./ListingsContent";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAppSession();
  const currentSearchParams = await searchParams;
  const currentUserId = canUseAgentFeatures(session) ? session.user.id : null;
  let properties;

  try {
    properties = await getListingsForViewer(
      session.role,
      currentUserId ?? undefined,
      session.role === "public" ? undefined : session.accessToken
    );
  } catch (error) {
    if (isListingReadError(error)) {
      return <ListingsUnavailable />;
    }

    throw error;
  }

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
