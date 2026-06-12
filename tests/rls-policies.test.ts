import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const policyPath = fileURLToPath(
  new URL("../supabase/rls-policies.sql", import.meta.url)
);
const rollbackPath = fileURLToPath(
  new URL("../supabase/rls-rollback.sql", import.meta.url)
);
const schemaPath = fileURLToPath(
  new URL("../supabase/listings.sql", import.meta.url)
);
const policies = readFileSync(policyPath, "utf8");
const rollback = readFileSync(rollbackPath, "utf8");
const schema = readFileSync(schemaPath, "utf8");

describe("RLS policy migration contract", () => {
  it("requires UUID ownership before enabling policies", () => {
    expect(policies).toContain(
      "public.listings.owner_id must be uuid"
    );
    expect(policies).toContain(
      "public.showing_requests.agent_owner_id must be uuid"
    );
  });

  it("enables RLS on profiles, listings, and showing requests", () => {
    expect(policies).toMatch(
      /alter table public\.profiles enable row level security/i
    );
    expect(policies).toMatch(
      /alter table public\.listings enable row level security/i
    );
    expect(policies).toMatch(
      /alter table public\.showing_requests enable row level security/i
    );
  });

  it("uses security-definer profile role helpers without recursive policies", () => {
    expect(policies).toContain(
      "create schema if not exists ethiomls_private"
    );
    expect(policies).toMatch(
      /function ethiomls_private\.is_agent_or_admin\(\)[\s\S]*security definer[\s\S]*role in \('agent', 'admin'\)/i
    );
    expect(policies).toMatch(
      /function ethiomls_private\.is_admin\(\)[\s\S]*security definer[\s\S]*role = 'admin'/i
    );
    expect(policies).toContain("set search_path = ''");
    expect(policies).not.toContain("function public.is_admin()");
  });

  it("lets authenticated users read only their own profile", () => {
    expect(policies).toMatch(
      /policy profiles_select_own[\s\S]*for select[\s\S]*to authenticated[\s\S]*using \(id = auth\.uid\(\)\)/i
    );
  });

  it("matches public and role-aware listing visibility rules", () => {
    expect(policies).toMatch(
      /policy listings_select_public[\s\S]*approval_status = 'Approved'[\s\S]*market_status in \('Coming Soon', 'Active', 'Pending', 'Closed'\)/i
    );
    expect(policies).toMatch(
      /policy listings_select_authenticated[\s\S]*owner_id = auth\.uid\(\)[\s\S]*approval_status = 'Approved'[\s\S]*market_status = 'Off Market'[\s\S]*ethiomls_private\.is_admin\(\)/i
    );
  });

  it("limits listing writes to valid owners and safe creation state", () => {
    expect(policies).toMatch(
      /policy listings_insert_owned[\s\S]*ethiomls_private\.is_agent_or_admin\(\)[\s\S]*owner_id = auth\.uid\(\)[\s\S]*approval_status = 'Unapproved'[\s\S]*verified = false[\s\S]*rejection_reason is null/i
    );
    expect(policies).toMatch(
      /policy listings_update_owned[\s\S]*owner_id = auth\.uid\(\)[\s\S]*with check[\s\S]*owner_id = auth\.uid\(\)/i
    );
    expect(policies).toMatch(
      /policy listings_delete_owned[\s\S]*owner_id = auth\.uid\(\)/i
    );
  });

  it("protects admin-controlled fields while preserving rejected resubmission", () => {
    expect(policies).toMatch(
      /function ethiomls_private\.enforce_listing_owner_update_rules\(\)[\s\S]*new\.listing_id := old\.listing_id[\s\S]*new\.owner_id := old\.owner_id/i
    );
    expect(policies).toMatch(
      /old\.approval_status = 'Rejected'[\s\S]*new\.approval_status := 'Unapproved'[\s\S]*new\.verified := false[\s\S]*new\.rejection_reason := null/i
    );
    expect(policies).toMatch(
      /else[\s\S]*new\.approval_status := old\.approval_status[\s\S]*new\.verified := old\.verified[\s\S]*new\.rejection_reason := old\.rejection_reason/i
    );
  });

  it("accepts only eligible, internally consistent showing requests", () => {
    expect(policies).toMatch(
      /policy showing_requests_insert_eligible[\s\S]*to anon, authenticated[\s\S]*status = 'New'/i
    );
    expect(policies).toContain(
      "auth.uid() is null or auth.uid() <> agent_owner_id"
    );
    expect(policies).toMatch(
      /listings\.id = showing_requests\.listing_id[\s\S]*listings\.owner_id = showing_requests\.agent_owner_id[\s\S]*listings\.title = showing_requests\.listing_title[\s\S]*listings\.listing_id = showing_requests\.listing_mls_id/i
    );
    expect(policies).toMatch(
      /listings\.approval_status = 'Approved'[\s\S]*listings\.market_status = 'Active'/i
    );
  });

  it("keeps showing-request reads owner-only, including for admins", () => {
    expect(policies).toMatch(
      /policy showing_requests_select_owned[\s\S]*ethiomls_private\.is_agent_or_admin\(\)[\s\S]*agent_owner_id = auth\.uid\(\)/i
    );
    expect(policies).not.toMatch(
      /policy showing_requests_select_owned[\s\S]*ethiomls_private\.is_admin\(\)/i
    );
  });

  it("keeps activation separate from the canonical schema setup", () => {
    expect(schema).toContain(
      "finish setup by running supabase/rls-policies.sql"
    );
    expect(schema).not.toMatch(/enable row level security/i);
  });
});

describe("RLS rollback contract", () => {
  it("drops every policy and disables RLS on all protected tables", () => {
    for (const policy of [
      "profiles_select_own",
      "listings_select_public",
      "listings_select_authenticated",
      "listings_insert_owned",
      "listings_update_owned",
      "listings_delete_owned",
      "showing_requests_insert_eligible",
      "showing_requests_select_owned",
    ]) {
      expect(rollback).toContain(`drop policy if exists ${policy}`);
    }

    expect(rollback).toMatch(
      /alter table public\.profiles disable row level security/i
    );
    expect(rollback).toMatch(
      /alter table public\.listings disable row level security/i
    );
    expect(rollback).toMatch(
      /alter table public\.showing_requests disable row level security/i
    );
  });

  it("removes the policy helper functions and owner-update trigger", () => {
    expect(rollback).toContain(
      "drop trigger if exists listings_enforce_owner_update_rules"
    );
    expect(rollback).toContain(
      "drop function if exists ethiomls_private.enforce_listing_owner_update_rules()"
    );
    expect(rollback).toContain(
      "drop function if exists ethiomls_private.is_agent_or_admin()"
    );
    expect(rollback).toContain(
      "drop function if exists ethiomls_private.is_admin()"
    );
    expect(rollback).toContain(
      "drop schema if exists ethiomls_private"
    );
  });
});
