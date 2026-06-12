type SupabaseConfig = {
  anonKey: string;
  authUrl: string;
  restUrl: string;
  storageUrl: string;
};

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  const baseUrl = url.replace(/\/$/, "");

  return {
    authUrl: `${baseUrl}/auth/v1`,
    restUrl: `${baseUrl}/rest/v1`,
    storageUrl: `${baseUrl}/storage/v1`,
    anonKey,
  };
}

function requireSupabaseConfig() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "Supabase URL and anonymous key are not configured."
    );
  }

  return config;
}

function requireAccessToken(accessToken: string) {
  const token = accessToken.trim();

  if (!token) {
    throw new Error("Supabase authenticated access token is required.");
  }

  return token;
}

function requireServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!key) {
    throw new Error("Supabase service role key is not configured.");
  }

  return key;
}

async function restRequest<T>(
  path: string,
  apiKey: string,
  bearerToken: string,
  init: RequestInit = {}
): Promise<T> {
  const config = requireSupabaseConfig();
  const response = await fetch(`${config.restUrl}${path}`, {
    ...init,
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Supabase request failed.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function anonymousSupabaseRequest<T>(
  path: string,
  init: RequestInit = {}
) {
  const { anonKey } = requireSupabaseConfig();
  return restRequest<T>(path, anonKey, anonKey, init);
}

export function authenticatedSupabaseRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {}
) {
  const { anonKey } = requireSupabaseConfig();
  return restRequest<T>(
    path,
    anonKey,
    requireAccessToken(accessToken),
    init
  );
}

export function serviceRoleSupabaseRequest<T>(
  path: string,
  init: RequestInit = {}
) {
  const serviceRoleKey = requireServiceRoleKey();
  return restRequest<T>(path, serviceRoleKey, serviceRoleKey, init);
}

export async function serviceRoleSupabaseAuthRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const config = requireSupabaseConfig();
  const serviceRoleKey = requireServiceRoleKey();
  const response = await fetch(`${config.authUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Supabase Auth request failed.");
  }

  return response.json() as Promise<T>;
}

function encodeStoragePath(path: string) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export async function uploadServiceRoleStorageObject(
  bucket: string,
  path: string,
  file: File
) {
  const config = requireSupabaseConfig();
  const serviceRoleKey = requireServiceRoleKey();
  const encodedPath = encodeStoragePath(path);
  const response = await fetch(
    `${config.storageUrl}/object/${encodeURIComponent(bucket)}/${encodedPath}`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: file,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Supabase storage upload failed.");
  }

  return `${config.storageUrl}/object/public/${encodeURIComponent(
    bucket
  )}/${encodedPath}`;
}
