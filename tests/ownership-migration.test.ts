import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const migrationPath = fileURLToPath(
  new URL("../supabase/ownership-uuid-migration.sql", import.meta.url)
);
const schemaPath = fileURLToPath(
  new URL("../supabase/listings.sql", import.meta.url)
);
const migration = readFileSync(migrationPath, "utf8");
const schema = readFileSync(schemaPath, "utf8");

describe("UUID ownership migration contract", () => {
  it("removes only the explicitly approved demo ownership records", () => {
    expect(migration).toContain(
      "where agent_owner_id in ('agent-1', 'agent-2')"
    );
    expect(migration).toContain(
      "where owner_id in ('agent-1', 'agent-2')"
    );
  });

  it("aborts for unexpected IDs, missing profiles, or orphan requests", () => {
    expect(migration).toContain("Invalid listing owner IDs");
    expect(migration).toContain("Listing owners without profiles");
    expect(migration).toContain("Invalid request owner IDs");
    expect(migration).toContain("Request owners without profiles");
    expect(migration).toContain(
      "Showing requests reference missing listings"
    );
    expect(migration).toContain(
      "Showing requests have mismatched listing owners"
    );
  });

  it("converts both ownership fields to UUIDs", () => {
    expect(migration).toMatch(
      /alter column owner_id type uuid using owner_id::uuid/i
    );
    expect(migration).toMatch(
      /alter column agent_owner_id type uuid using agent_owner_id::uuid/i
    );
  });

  it("adds cascading profile and listing relationships", () => {
    expect(migration).toMatch(
      /constraint listings_owner_id_fkey[\s\S]*references public\.profiles\(id\)[\s\S]*on delete cascade/i
    );
    expect(migration).toMatch(
      /constraint showing_requests_agent_owner_id_fkey[\s\S]*references public\.profiles\(id\)[\s\S]*on delete cascade/i
    );
    expect(migration).toMatch(
      /constraint showing_requests_listing_id_fkey[\s\S]*references public\.listings\(id\)[\s\S]*on delete cascade/i
    );
    expect(migration).toMatch(
      /constraint showing_requests_listing_owner_fkey[\s\S]*references public\.listings\(id, owner_id\)[\s\S]*on delete cascade/i
    );
  });
});

describe("new-environment ownership schema", () => {
  it("uses UUID profile relationships without legacy demo seeds", () => {
    expect(schema).toContain(
      "owner_id uuid not null references public.profiles(id) on delete cascade"
    );
    expect(schema).toContain(
      "agent_owner_id uuid not null references public.profiles(id) on delete cascade"
    );
    expect(schema).toContain(
      "listing_id text not null references public.listings(id) on delete cascade"
    );
    expect(schema).toContain("unique (id, owner_id)");
    expect(schema).toMatch(
      /foreign key \(listing_id, agent_owner_id\)[\s\S]*references public\.listings\(id, owner_id\)[\s\S]*on delete cascade/i
    );
    expect(schema).not.toContain("'agent-1'");
    expect(schema).not.toContain("'agent-2'");
  });
});
