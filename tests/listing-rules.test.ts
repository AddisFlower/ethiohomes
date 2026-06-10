import { describe, expect, it } from "vitest";
import {
  canAgentBrowseListing,
  canViewerBrowseListing,
  getShowingEligibility,
  isPubliclyVisibleListing,
  marketStatuses,
} from "@/lib/listing-rules";
import { authUser, otherAuthUser } from "@/tests/fixtures/auth";
import { createListingFixture } from "@/tests/fixtures/listings";

describe("listing visibility policies", () => {
  it.each(["Coming Soon", "Active", "Pending", "Closed"] as const)(
    "makes Approved + %s publicly visible",
    (marketStatus) => {
      expect(
        isPubliclyVisibleListing(
          createListingFixture({ approvalStatus: "Approved", marketStatus })
        )
      ).toBe(true);
    }
  );

  it("hides Off Market, Unapproved, and Rejected listings from public viewers", () => {
    expect(
      isPubliclyVisibleListing(
        createListingFixture({
          approvalStatus: "Approved",
          marketStatus: "Off Market",
        })
      )
    ).toBe(false);
    expect(
      isPubliclyVisibleListing(
        createListingFixture({ approvalStatus: "Unapproved" })
      )
    ).toBe(false);
    expect(
      isPubliclyVisibleListing(
        createListingFixture({ approvalStatus: "Rejected" })
      )
    ).toBe(false);
  });

  it("lets agents browse owned, public, and other-agent Off Market listings", () => {
    expect(
      canAgentBrowseListing(
        createListingFixture({
          approvalStatus: "Rejected",
          ownerId: authUser.id,
        }),
        authUser.id
      )
    ).toBe(true);
    expect(
      canAgentBrowseListing(
        createListingFixture({ ownerId: otherAuthUser.id }),
        authUser.id
      )
    ).toBe(true);
    expect(
      canAgentBrowseListing(
        createListingFixture({
          approvalStatus: "Rejected",
          marketStatus: "Off Market",
          ownerId: otherAuthUser.id,
        }),
        authUser.id
      )
    ).toBe(true);
  });

  it("hides another agent's non-public, non-Off-Market listing", () => {
    expect(
      canAgentBrowseListing(
        createListingFixture({
          approvalStatus: "Rejected",
          marketStatus: "Active",
          ownerId: otherAuthUser.id,
        }),
        authUser.id
      )
    ).toBe(false);
  });

  it("treats incomplete users as public viewers and admins as global viewers", () => {
    const hiddenListing = createListingFixture({
      approvalStatus: "Rejected",
      marketStatus: "Active",
      ownerId: otherAuthUser.id,
    });

    expect(canViewerBrowseListing(hiddenListing, "public")).toBe(false);
    expect(
      canViewerBrowseListing(hiddenListing, "incomplete", authUser.id)
    ).toBe(false);
    expect(
      canViewerBrowseListing(hiddenListing, "agent", authUser.id)
    ).toBe(false);
    expect(canViewerBrowseListing(hiddenListing, "admin", authUser.id)).toBe(
      true
    );
  });
});

describe("showing eligibility", () => {
  it("allows only Approved + Active listings", () => {
    expect(
      getShowingEligibility(
        createListingFixture({
          approvalStatus: "Approved",
          marketStatus: "Active",
        })
      )
    ).toEqual({ allowed: true, message: null });

    for (const marketStatus of marketStatuses.filter(
      (status) => status !== "Active"
    )) {
      expect(
        getShowingEligibility(
          createListingFixture({
            approvalStatus: "Approved",
            marketStatus,
          })
        ).allowed
      ).toBe(false);
    }

    expect(
      getShowingEligibility(
        createListingFixture({ approvalStatus: "Unapproved" })
      ).allowed
    ).toBe(false);
    expect(
      getShowingEligibility(
        createListingFixture({ approvalStatus: "Rejected" })
      ).allowed
    ).toBe(false);
  });
});
