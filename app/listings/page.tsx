import { Suspense } from "react";
import { getListings } from "@/lib/listings";
import ListingsContent from "./ListingsContent";

export default async function ListingsPage() {
  const properties = await getListings();

  return (
    <Suspense>
      <ListingsContent properties={properties} />
    </Suspense>
  );
}
