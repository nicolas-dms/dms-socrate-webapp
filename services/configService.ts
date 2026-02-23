/**
 * Config Service
 *
 * Fetches runtime configuration from the Next.js server-side /api/config endpoint.
 * The result is cached in memory after the first call — subsequent calls are free.
 *
 * Why this exists:
 *   NEXT_PUBLIC_* variables are baked into the JS bundle at Docker build time.
 *   API_URL (no prefix) is a server-side env var set directly on the ACA container,
 *   readable at runtime via /api/config without requiring a rebuild.
 */

let cachedApiUrl: string | null = null;
let fetchPromise: Promise<string> | null = null;

async function fetchApiUrl(): Promise<string> {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error(`/api/config returned ${response.status}`);
    const data = await response.json();
    return data.apiUrl || 'http://localhost:8000';
  } catch (error) {
    console.error('[configService] Failed to fetch /api/config, falling back to localhost', error);
    return 'http://localhost:8000';
  }
}

/**
 * Returns the backend API base URL.
 * Fetches /api/config on first call, then returns the cached value forever.
 */
export async function getApiUrl(): Promise<string> {
  // Already cached — return immediately
  if (cachedApiUrl !== null) return cachedApiUrl;

  // Fetch in progress — wait for it (avoids concurrent duplicate requests)
  if (fetchPromise !== null) return fetchPromise;

  fetchPromise = fetchApiUrl().then((url) => {
    cachedApiUrl = url;
    fetchPromise = null;
    console.log(`[configService] API URL resolved: ${url}`);
    return url;
  });

  return fetchPromise;
}

/**
 * Synchronous accessor — only valid after getApiUrl() has been awaited at least once.
 * Falls back to localhost if called before initial fetch completes.
 */
export function getApiUrlSync(): string {
  return cachedApiUrl || 'http://localhost:8000';
}
