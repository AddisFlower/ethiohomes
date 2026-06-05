import type { Property } from "@/lib/listings";

export const properties: Property[] = [
  {
    id: "1",
    listingId: "MLS-1001",
    title: "Modern Apartment in Bole",
    price: "12,500,000 ETB",
    location: "Addis Ababa, Bole",
    address: "Bole Rwanda Embassy Area, House No. B-214",
    propertyType: "Apartment",
    transactionType: "For Sale",
    marketStatus: "Active",
    verified: true,
    bedrooms: 3,
    bathrooms: 2,
    agent: "Dawit Realty",
    updatedAt: "Updated 2 hours ago",
    updatedAtTimestamp: null,
    approvalStatus: "Approved",
    rejectionReason: null,
    description:
      "Beautiful modern apartment located in the heart of Bole near restaurants, shopping centers, and schools.",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop",
    ownerId: "agent-1"
  },
  {
    id: "2",
    title: "Luxury Villa in Summit",
    propertyType: "Villa",
    price: "28,000,000 ETB",
    location: "Addis Ababa, Summit",
    address: "Summit Figa, near Safari Apartments, Villa 18",
    transactionType: "For Rent",
    marketStatus: "Pending",
    verified: true,
    bedrooms: 5,
    bathrooms: 4,
    listingId: "MLS-1002",
    agent: "Habesha Properties",
    updatedAt: "Updated yesterday",
    updatedAtTimestamp: null,
    approvalStatus: "Unapproved",
    rejectionReason: null,
    description:
      "Spacious luxury villa with modern architecture, large outdoor area, and premium finishes.",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop",
    ownerId: "agent-2"
  },
  {
    id: "3",
    title: "Family Home in CMC",
    propertyType: "House",
    price: "18,750,000 ETB",
    location: "Addis Ababa, CMC",
    address: "CMC Michael Road, behind Tsehay Real Estate, House 42",
    transactionType: "For Sale",
    marketStatus: "Active",
    verified: false,
    bedrooms: 4,
    bathrooms: 3,
    listingId: "MLS-1003",
    agent: "Ethio Land Brokers",
    updatedAt: "Updated 3 days ago",
    updatedAtTimestamp: null,
    approvalStatus: "Rejected",
    rejectionReason:
      "Please add clearer exterior photos and confirm the property address.",
    description:
      "Perfect family home in a quiet neighborhood with easy access to schools and shopping.",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
      ownerId: "agent-1"
  },
];
