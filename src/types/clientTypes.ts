export interface PhoneVerifyPayload {
  orgId: string;
  phone: string;
}

export interface PhoneConfirmPayload {
  orgId: string;
  phone: string;
  code: string;
}

export interface PhoneConfirmResponse {
  token: string;
  clientId: string;
  isNewClient: boolean;
  expiresAt: string;
}

export interface ClientProfileResponse {
  id: string;
  orgId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string;
  email: string | null;
  createdAt: string;
  lastSeenAt: string;
}

export interface UpdateClientProfilePayload {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export interface ClientConsultantResponse {
  orgMemberId: string;
  fullName: string;
  avatarUrl: string | null;
}

/**
 * Anonymous shape returned by `GET /api/client/orgs/{orgId}` so a cold SMS
 * link with `?org=<uuid>` can bootstrap org branding before the user OTPs in.
 */
export interface ClientOrgInfoResponse {
  orgId: string;
  orgName: string;
  logoUrl: string | null;
  brandColor: string | null;
}
