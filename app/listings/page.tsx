import { Suspense } from "react";
import { canUseAgentFeatures, getAppSession } from "@/lib/auth";
import { getListings } from "@/lib/listings";
import ListingsContent from "./ListingsContent";

export default async function ListingsPage() {
  const session = await getAppSession();
  const properties = await getListings();
  const currentUserId = canUseAgentFeatures(session) ? session.user.id : null;

  return (
    <Suspense>
      <ListingsContent properties={properties} currentUserId={currentUserId} />
    </Suspense>
  );
}
