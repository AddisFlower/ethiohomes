export const approvalStatuses = [
  "Unapproved",
  "Approved",
  "Rejected",
] as const;

export const marketStatuses = [
  "Coming Soon",
  "Active",
  "Pending",
  "Closed",
  "Off Market",
] as const;

export const createMarketStatuses = [
  "Coming Soon",
  "Active",
  "Off Market",
] as const;

export const transactionTypes = ["For Sale", "For Rent"] as const;

export const propertyTypes = [
  "Apartment",
  "Villa",
  "House",
  "Condo",
  "Multi-Family",
  "Land",
  "Commercial",
  "Office",
] as const;

export type ApprovalStatus = (typeof approvalStatuses)[number];
export type MarketStatus = (typeof marketStatuses)[number];
export type TransactionType = (typeof transactionTypes)[number];

const residentialPropertyTypes = new Set([
  "Apartment",
  "Villa",
  "House",
  "Condo",
  "Multi-Family",
]);

export function getPropertyFieldRules(propertyType: string) {
  if (residentialPropertyTypes.has(propertyType)) {
    return {
      showBedrooms: true,
      bedroomsRequired: true,
      showBathrooms: true,
      bathroomsRequired: true,
    };
  }

  if (propertyType === "Commercial" || propertyType === "Office") {
    return {
      showBedrooms: false,
      bedroomsRequired: false,
      showBathrooms: true,
      bathroomsRequired: false,
    };
  }

  return {
    showBedrooms: false,
    bedroomsRequired: false,
    showBathrooms: false,
    bathroomsRequired: false,
  };
}

export function isPubliclyVisibleListing(listing: {
  approvalStatus: string;
  marketStatus: string;
}) {
  return (
    listing.approvalStatus === "Approved" &&
    ["Coming Soon", "Active", "Pending", "Closed"].includes(
      listing.marketStatus
    )
  );
}

export function canAgentBrowseListing(
  listing: {
    approvalStatus: string;
    marketStatus: string;
    ownerId: string;
  },
  userId: string
) {
  return (
    listing.ownerId === userId ||
    listing.marketStatus === "Off Market" ||
    isPubliclyVisibleListing(listing)
  );
}

export function getShowingEligibility(listing: {
  approvalStatus: string;
  marketStatus: string;
}) {
  if (listing.approvalStatus !== "Approved") {
    return {
      allowed: false,
      message: "Showings are unavailable while this listing is under review.",
    };
  }

  if (listing.marketStatus === "Coming Soon") {
    return {
      allowed: false,
      message: "Showings are not available yet.",
    };
  }

  if (listing.marketStatus === "Pending") {
    return {
      allowed: false,
      message: "This listing is pending and is not accepting showing requests.",
    };
  }

  if (listing.marketStatus === "Closed") {
    return {
      allowed: false,
      message: "This listing is closed and is not accepting showing requests.",
    };
  }

  if (listing.marketStatus === "Off Market") {
    return {
      allowed: false,
      message: "This listing is off market and is not accepting showing requests.",
    };
  }

  return {
    allowed: true,
    message: null,
  };
}
