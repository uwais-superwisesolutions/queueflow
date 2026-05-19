export type PortalLinkScope = 'org' | 'department' | 'seat';

export interface CreatePortalLinkPayload {
  name: string;
  scopeType: PortalLinkScope;
  scopeId?: string | null;
}

export interface PortalLinkResponse {
  id: string;
  name: string;
  slug: string;
  scopeType: PortalLinkScope;
  scopeId: string | null;
  scanCount: number;
  isActive: boolean;
  createdAt: string;
}

// Anonymous scan response — drives the client landing flow.

export interface PortalScopeResponse {
  type: PortalLinkScope;
  id: string | null;
  name: string | null;
}

export interface PortalScanResponse {
  orgId: string;
  orgName: string;
  logoUrl: string | null;
  brandColor: string | null;
  scope: PortalScopeResponse;
}
