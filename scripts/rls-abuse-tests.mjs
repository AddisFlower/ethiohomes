import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadLocalEnv();

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "RLS_AGENT_A_EMAIL",
  "RLS_AGENT_A_PASSWORD",
  "RLS_AGENT_B_EMAIL",
  "RLS_AGENT_B_PASSWORD",
  "RLS_ADMIN_EMAIL",
  "RLS_ADMIN_PASSWORD",
  "RLS_AGENT_B_USER_ID",
  "RLS_AGENT_B_LISTING_ID",
  "RLS_AGENT_A_APPROVED_LISTING_ID",
  "RLS_AGENT_B_ACTIVE_LISTING_ID",
  "RLS_INELIGIBLE_PUBLIC_LISTING_ID",
];

const missing = requiredEnv.filter((key) => !env(key, false));

if (missing.length > 0) {
  console.error("Missing required RLS abuse test environment variables:");
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

const baseUrl = env("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const restUrl = `${baseUrl}/rest/v1`;
const authUrl = `${baseUrl}/auth/v1`;
const storageUrl = `${baseUrl}/storage/v1`;
const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY", false);
const createdShowingRequestIds = [];
const createdStorageObjects = [];

const agentA = await signIn(
  env("RLS_AGENT_A_EMAIL"),
  env("RLS_AGENT_A_PASSWORD")
);
const agentB = await signIn(
  env("RLS_AGENT_B_EMAIL"),
  env("RLS_AGENT_B_PASSWORD")
);
const admin = await signIn(
  env("RLS_ADMIN_EMAIL"),
  env("RLS_ADMIN_PASSWORD")
);

const agentAProfile = await readOwnProfile(agentA.access_token);
const agentBProfile = await readOwnProfile(agentB.access_token);
const adminProfile = await readOwnProfile(admin.access_token);

assert(
  agentAProfile.role === "agent" || agentAProfile.role === "admin",
  "Agent A profile must have agent/admin role."
);
assert(
  agentBProfile.role === "agent" || agentBProfile.role === "admin",
  "Agent B profile must have agent/admin role."
);
assert(adminProfile.role === "admin", "Admin profile must have admin role.");
assert(
  agentBProfile.id === env("RLS_AGENT_B_USER_ID"),
  "RLS_AGENT_B_USER_ID does not match Agent B profile id."
);

const agentBListing = await readListingFixture(
  env("RLS_AGENT_B_LISTING_ID"),
  agentB.access_token,
  "RLS_AGENT_B_LISTING_ID"
);
const agentAApprovedListing = await readListingFixture(
  env("RLS_AGENT_A_APPROVED_LISTING_ID"),
  agentA.access_token,
  "RLS_AGENT_A_APPROVED_LISTING_ID"
);
const agentBActiveListing = await readListingFixture(
  env("RLS_AGENT_B_ACTIVE_LISTING_ID"),
  agentB.access_token,
  "RLS_AGENT_B_ACTIVE_LISTING_ID"
);
const ineligiblePublicListing = await readListingFixture(
  env("RLS_INELIGIBLE_PUBLIC_LISTING_ID"),
  anonKey,
  "RLS_INELIGIBLE_PUBLIC_LISTING_ID"
);

assert(
  agentBListing.owner_id === agentBProfile.id,
  "RLS_AGENT_B_LISTING_ID must identify a listing owned by Agent B."
);
assert(
  agentAApprovedListing.owner_id === agentAProfile.id &&
    agentAApprovedListing.approval_status === "Approved" &&
    agentAApprovedListing.verified === true,
  "RLS_AGENT_A_APPROVED_LISTING_ID must identify Agent A's Approved + verified listing."
);
assert(
  agentBActiveListing.owner_id === agentBProfile.id &&
    agentBActiveListing.approval_status === "Approved" &&
    agentBActiveListing.market_status === "Active",
  "RLS_AGENT_B_ACTIVE_LISTING_ID must identify Agent B's Approved + Active listing."
);
assert(
  ineligiblePublicListing.approval_status !== "Approved" ||
    ineligiblePublicListing.market_status !== "Active",
  "RLS_INELIGIBLE_PUBLIC_LISTING_ID must identify a public-readable listing that is not Approved + Active."
);

const tests = [
  test(
    "Agent A cannot update an Agent B listing",
    async () => {
      const rows = await rest(
        `/listings?id=eq.${encodeURIComponent(agentBListing.id)}`,
        agentA.access_token,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            title: `Blocked update ${Date.now()}`,
          }),
        }
      );

      assertNoRows(rows);
    }
  ),
  test(
    "Agent A cannot delete an Agent B listing",
    async () => {
      const rows = await rest(
        `/listings?id=eq.${encodeURIComponent(agentBListing.id)}`,
        agentA.access_token,
        {
          method: "DELETE",
          headers: { Prefer: "return=representation" },
        }
      );

      assertNoRows(rows);
    }
  ),
  test(
    "Agent A cannot insert a listing owned by Agent B",
    async () => {
      const response = await restRaw("/listings", agentA.access_token, {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          ...listingInsertFixture(),
          owner_id: env("RLS_AGENT_B_USER_ID"),
        }),
      });

      await assertRejectedOrNoRows(response);
    }
  ),
  test(
    "Agent A cannot insert a listing as Approved or verified",
    async () => {
      const response = await restRaw("/listings", agentA.access_token, {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          ...listingInsertFixture(),
          owner_id: agentAProfile.id,
          approval_status: "Approved",
          verified: true,
        }),
      });

      await assertRejectedOrNoRows(response);
    }
  ),
  test(
    "Agent A cannot directly change owned approval fields",
    async () => {
      const listingPath = `/listings?id=eq.${encodeURIComponent(
        agentAApprovedListing.id
      )}`;
      const rows = await rest(listingPath, agentA.access_token, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          approval_status: "Rejected",
          verified: false,
          rejection_reason: "Direct abuse attempt",
        }),
      });

      if (rows.length > 0) {
        assert(
          rows[0].approval_status === "Approved" &&
            rows[0].verified === true &&
            rows[0].rejection_reason !== "Direct abuse attempt",
          "Owner approval-field PATCH returned mutated admin-controlled fields."
        );
      }
    }
  ),
  test(
    "Agent A cannot read Agent B showing-request rows",
    async () => {
      const request = await insertShowingRequestForListing(
        agentBActiveListing,
        agentA.access_token
      );
      createdShowingRequestIds.push(request.id);
      const rows = await rest(
        `/showing_requests?id=eq.${encodeURIComponent(request.id)}`,
        agentA.access_token
      );

      assertNoRows(rows);
    }
  ),
  test(
    "Admin cannot read another agent's showing-request rows",
    async () => {
      const request = await insertShowingRequestForListing(
        agentBActiveListing,
        agentA.access_token
      );
      createdShowingRequestIds.push(request.id);
      const rows = await rest(
        `/showing_requests?id=eq.${encodeURIComponent(request.id)}`,
        admin.access_token
      );

      assertNoRows(rows);
    }
  ),
  test(
    "Anonymous users cannot read showing-request rows",
    async () => {
      const rows = await rest("/showing_requests?select=*&limit=1", anonKey);

      assertNoRows(rows);
    }
  ),
  test(
    "Anonymous users cannot insert mismatched showing-request snapshots",
    async () => {
      const response = await restRaw("/showing_requests", anonKey, {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(showingRequestFixture(agentBActiveListing, {
          listing_title: `${agentBActiveListing.title} mismatch`,
        })),
      });

      await assertRejectedOrNoRows(response);
    }
  ),
  test(
    "Anonymous users cannot insert showing requests for ineligible listings",
    async () => {
      const response = await restRaw("/showing_requests", anonKey, {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(showingRequestFixture(ineligiblePublicListing)),
      });

      await assertRejectedOrNoRows(response);
    }
  ),
  test(
    "Agent A cannot upload listing images under Agent B's storage folder",
    async () => {
      const path = `${agentBProfile.id}/rls-abuse-${randomUUID()}/blocked.jpg`;
      const response = await storageUploadRaw(path, agentA.access_token);

      if (response.ok) {
        createdStorageObjects.push(path);
        throw new Error(
          "Expected Agent A's upload under Agent B's folder to be rejected."
        );
      }
    }
  ),
  test(
    "Anonymous users cannot upload listing images",
    async () => {
      const path = `${agentAProfile.id}/rls-abuse-${randomUUID()}/blocked.jpg`;
      const response = await storageUploadRaw(path, anonKey);

      if (response.ok) {
        createdStorageObjects.push(path);
        throw new Error(
          "Expected anonymous listing image upload to be rejected."
        );
      }
    }
  ),
];

let failed = false;

for (const item of tests) {
  try {
    await item.run();
    console.log(`PASS ${item.name}`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${item.name}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

await cleanupShowingRequests();
await cleanupStorageObjects();

if (failed) {
  process.exit(1);
}

function loadLocalEnv() {
  const envPath = resolve(".env.local");

  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value.replace(/^['"]|['"]$/g, "");
    }
  }
}

function env(key, required = true) {
  const value = process.env[key]?.trim();

  if (!value && required) {
    throw new Error(`${key} is required.`);
  }

  return value ?? "";
}

function test(name, run) {
  return { name, run };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNoRows(rows) {
  assert(Array.isArray(rows), "Expected a PostgREST array response.");
  assert(rows.length === 0, `Expected no rows, received ${rows.length}.`);
}

async function signIn(email, password) {
  const response = await fetch(`${authUrl}/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Supabase sign-in failed for ${email}: ${await response.text()}`);
  }

  return response.json();
}

async function rest(path, bearerToken, init = {}) {
  const response = await restRaw(path, bearerToken, init);

  if (!response.ok) {
    throw new Error(`REST ${init.method ?? "GET"} ${path} failed: ${await response.text()}`);
  }

  const text = await response.text();

  return text ? JSON.parse(text) : undefined;
}

function restRaw(path, bearerToken, init = {}) {
  return fetch(`${restUrl}${path}`, {
    ...init,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

function storageUploadRaw(path, bearerToken) {
  return fetch(
    `${storageUrl}/object/listing-images/${encodeStoragePath(path)}`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
      },
      body: new Blob(["blocked"], { type: "image/jpeg" }),
    }
  );
}

function encodeStoragePath(path) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function serviceRest(path, init = {}) {
  if (!serviceRoleKey) {
    return undefined;
  }

  const response = await fetch(`${restUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    console.warn(`Cleanup request failed: ${await response.text()}`);
  }

  return response;
}

async function assertRejectedOrNoRows(response) {
  if (!response.ok) {
    return;
  }

  const text = await response.text();
  const rows = text ? JSON.parse(text) : undefined;

  if (Array.isArray(rows)) {
    assertNoRows(rows);
    return;
  }

  throw new Error("Expected the request to be rejected or return no rows.");
}

async function readOwnProfile(accessToken) {
  const rows = await rest("/profiles?select=id,role&limit=1", accessToken);

  assert(rows.length === 1, "Expected signed-in user to read exactly one profile.");

  return rows[0];
}

async function readListingFixture(value, bearerToken, envName) {
  const queryValue = encodeURIComponent(value);
  const rows = await rest(
    `/listings?select=*&or=(id.eq.${queryValue},listing_id.eq.${queryValue})&limit=1`,
    bearerToken
  );

  assert(
    rows.length === 1,
    `Expected one readable listing for ${envName} (${value}). Use either public.listings.id or public.listings.listing_id.`
  );

  return rows[0];
}

function listingInsertFixture() {
  const id = randomUUID();

  return {
    id,
    title: `RLS blocked insert ${id}`,
    price: "1 ETB",
    location: "Addis Ababa",
    address: "RLS disposable address",
    property_type: "Apartment",
    status: "For Sale",
    transaction_type: "For Sale",
    market_status: "Active",
    verified: false,
    bedrooms: 1,
    bathrooms: 1,
    agent: "RLS Abuse Test",
    approval_status: "Unapproved",
    rejection_reason: null,
    description: "Disposable row for RLS abuse testing.",
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop",
  };
}

function showingRequestFixture(listing, overrides = {}) {
  const id = randomUUID();

  return {
    id,
    listing_id: listing.id,
    listing_title: listing.title,
    listing_mls_id: listing.listing_id,
    agent_owner_id: listing.owner_id,
    requester_name: "RLS Abuse Test",
    requester_email: `rls-abuse-${id}@example.com`,
    requester_phone: null,
    preferred_datetime: null,
    message: "Disposable RLS abuse test request.",
    status: "New",
    ...overrides,
  };
}

async function insertShowingRequestForListing(listing, bearerToken) {
  const request = showingRequestFixture(listing);
  const response = await restRaw("/showing_requests", bearerToken, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to create disposable showing request: ${await response.text()}`);
  }

  return request;
}

async function cleanupShowingRequests() {
  if (!serviceRoleKey || createdShowingRequestIds.length === 0) {
    return;
  }

  for (const id of createdShowingRequestIds) {
    await serviceRest(`/showing_requests?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }
}

async function cleanupStorageObjects() {
  if (!serviceRoleKey || createdStorageObjects.length === 0) {
    return;
  }

  const response = await fetch(`${storageUrl}/object/listing-images`, {
    method: "DELETE",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prefixes: createdStorageObjects,
    }),
  });

  if (!response.ok) {
    console.warn(`Storage cleanup failed: ${await response.text()}`);
  }
}
