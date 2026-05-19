/**
 * Resolves the org the client portal is currently targeting.
 *
 * Lookup order:
 *   1. `?org=<uuid>` on the current URL — set by a portal-link landing page.
 *   2. localStorage cache (so the user can navigate within the portal).
 *   3. `VITE_DEFAULT_CLIENT_ORG_ID` env var — dev/testing fallback.
 *
 * Returns `null` if none of those resolve.
 *
 * M7 (portal links) will replace this with a server-side lookup that resolves
 * a slug to org metadata. For now this thin helper is enough.
 */

const STORAGE_KEY = 'client_org_id';

function readQueryParam(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const value = params.get('org');
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function resolveClientOrgId(): string | null {
  const fromQuery = readQueryParam();
  if (fromQuery) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, fromQuery);
    }
    return fromQuery;
  }

  if (typeof window !== 'undefined') {
    const cached = window.localStorage.getItem(STORAGE_KEY);
    if (cached) return cached;
  }

  const fallback = import.meta.env.VITE_DEFAULT_CLIENT_ORG_ID as string | undefined;
  return fallback && fallback.trim().length > 0 ? fallback : null;
}

export function clearClientOrgId() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
