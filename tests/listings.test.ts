import { beforeEach, describe, expect, it, vi } from "vitest";
import { authUser, otherAuthUser } from "@/tests/fixtures/auth";

const mocks = vi.hoisted(() => ({
  supabaseRequest: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabaseRequest: mocks.supabaseRequest,
  uploadSupabaseStorageObject: vi.fn(),
}));

import {
  deleteListing,
  listingNotFoundOrDeniedMessage,
} from "@/lib/listings";

describe("deleteListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes and returns the row matching both listing and owner IDs", async () => {
    const deletedRow = {
      id: "listing/with spaces",
      owner_id: authUser.id,
    };
    mocks.supabaseRequest.mockResolvedValue([deletedRow]);

    await expect(
      deleteListing(deletedRow.id, authUser.id)
    ).resolves.toEqual(deletedRow);

    expect(mocks.supabaseRequest).toHaveBeenCalledWith(
      `/listings?id=eq.listing%2Fwith%20spaces&owner_id=eq.${authUser.id}`,
      {
        method: "DELETE",
        headers: {
          Prefer: "return=representation",
        },
      }
    );
  });

  it("rejects a non-owner delete when the owner filter returns no row", async () => {
    mocks.supabaseRequest.mockResolvedValue([]);

    await expect(
      deleteListing("listing-1", otherAuthUser.id)
    ).rejects.toThrow(listingNotFoundOrDeniedMessage);
  });

  it("rejects a missing listing when the delete returns no row", async () => {
    mocks.supabaseRequest.mockResolvedValue([]);

    await expect(
      deleteListing("missing-listing", authUser.id)
    ).rejects.toThrow(listingNotFoundOrDeniedMessage);
  });

  it("preserves Supabase failures instead of reporting a successful delete", async () => {
    mocks.supabaseRequest.mockRejectedValue(
      new Error("Supabase delete failed.")
    );

    await expect(
      deleteListing("listing-1", authUser.id)
    ).rejects.toThrow("Supabase delete failed.");
  });
});
