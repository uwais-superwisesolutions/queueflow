import { scanPortalLink } from '@/services/portalLinkApi';
import { getClientOrgInfo } from '@/services/clientApi';
import type { PortalScanResponse } from '@/types';

/**
 * Resolves the org the client portal is currently targeting.
 *
 * Lookup order (synchronous fast path):
 *   1. `?org=<uuid>` on the current URL — useful for dev & internal previews.
 *   2. localStorage cache (so the user can navigate within the portal).
 *   3. `VITE_DEFAULT_CLIENT_ORG_ID` env var — dev/testing fallback.
 *
 * For the real-world entry point (a `?slug=<slug>` portal-link URL),
 * use `resolvePortalScan()` which hits `POST /api/client/portal-links/{slug}/scan`,
 * bumps the scan count, caches the result, and returns the full metadata.
 */

const ORG_KEY = 'client_org_id';
const SCAN_KEY = 'client_portal_scan';

function param(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get(name);
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function resolveClientOrgId(): string | null {
  const fromQuery = param('org');
  if (fromQuery) {
    if (typeof window !== 'undefined') window.localStorage.setItem(ORG_KEY, fromQuery);
    return fromQuery;
  }

  if (typeof window !== 'undefined') {
    const cached = window.localStorage.getItem(ORG_KEY);
    if (cached) return cached;
  }

  const fallback = import.meta.env.VITE_DEFAULT_CLIENT_ORG_ID as string | undefined;
  return fallback && fallback.trim().length > 0 ? fallback : null;
}

export function getCachedPortalScan(): PortalScanResponse | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SCAN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PortalScanResponse;
  } catch {
    return null;
  }
}

function persistScan(scan: PortalScanResponse) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SCAN_KEY, JSON.stringify(scan));
  window.localStorage.setItem(ORG_KEY, scan.orgId);
}

/**
 * If the current URL has `?slug=<slug>`, hits the scan endpoint and caches the
 * resulting org metadata. Otherwise, if `?org=<uuid>` is present (or just an
 * orgId is cached) but no scan, falls back to the anonymous org-info lookup
 * so a cold SMS link can still render branded headers. Returns null if no
 * org context is available at all.
 */
export async function resolvePortalScan(): Promise<PortalScanResponse | null> {
  const slug = param('slug');
  if (slug) {
    try {
      const resp = await scanPortalLink(slug);
      persistScan(resp.data);
      return resp.data;
    } catch {
      // Fall through to org-info / cache — a stale cached org is better than
      // nothing if the user is offline / the slug is invalid.
    }
  }

  const cached = getCachedPortalScan();
  const orgId = resolveClientOrgId();

  // SMS deep-link path: we have an orgId from the URL/cache, but no scan yet
  // (or the cached scan is for a different org). Fetch the anonymous org info
  // and synthesise a scan-shaped response so the rest of the UI can use it.
  if (orgId && (!cached || cached.orgId !== orgId)) {
    try {
      const resp = await getClientOrgInfo(orgId);
      const synthesised: PortalScanResponse = {
        orgId: resp.data.orgId,
        orgName: resp.data.orgName,
        logoUrl: resp.data.logoUrl,
        brandColor: resp.data.brandColor,
        scope: { type: 'org', id: null, name: null },
      };
      persistScan(synthesised);
      return synthesised;
    } catch {
      // Fall through to cached value (if any).
    }
  }

  return cached;
}

export function clearClientOrg() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ORG_KEY);
  window.localStorage.removeItem(SCAN_KEY);
}
