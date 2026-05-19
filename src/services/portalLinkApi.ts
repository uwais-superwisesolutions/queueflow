import api from './interceptor';
import type {
  CreatePortalLinkPayload,
  PortalLinkResponse,
  PortalScanResponse,
} from '@/types';

// ---------- /secure/portal-links (super user) ----------

export function listPortalLinks() {
  return api.request<PortalLinkResponse[]>({
    url: '/secure/portal-links',
    method: 'GET',
  });
}

export function createPortalLink(payload: CreatePortalLinkPayload) {
  return api.request<PortalLinkResponse>({
    url: '/secure/portal-links',
    method: 'POST',
    data: payload,
  });
}

export function deletePortalLink(id: string) {
  return api.request<{ message: string }>({
    url: `/secure/portal-links/${id}`,
    method: 'DELETE',
  });
}

// ---------- /api/client/portal-links (anonymous, no JWT) ----------

export function scanPortalLink(slug: string) {
  return api.request<PortalScanResponse>({
    url: `/api/client/portal-links/${slug}/scan`,
    method: 'POST',
  });
}
