import { getListings } from "@/lib/listings";
import HomeContent from "./HomeContent";

export default async function Home() {
  const properties = await getListings();

  return <HomeContent properties={properties} />;
}
