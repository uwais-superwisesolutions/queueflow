import type { MemberRole } from './authTypes';

export interface OrganisationResponse {
  id: string;
  name: string;
  industry: string | null;
  logoUrl: string | null;
  brandColor: string | null;
  /**
   * IANA timezone name (e.g. "Africa/Johannesburg"). Availability windows
   * are interpreted in this zone. UI converts slot UTC instants to the
   * browser's local zone for display; this field exists so the org-user
   * availability editor can show "Times shown in {timezone}".
   */
  timezone: string;
  onboardingStep: string | null;
  onboardingComplete: boolean;
  createdAt: string;
}

export interface UpdateBrandingPayload {
  industry?: string | null;
  logoUrl?: string | null;
  brandColor?: string | null;
  timezone?: string | null;
}

export interface UpdateOnboardingStepPayload {
  onboardingStep: string;
}

export interface MemberResponse {
  orgMemberId: string;
  authUserId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: MemberRole;
  status: 'active' | 'suspended';
  joinedAt: string;
}

export interface InviteUserPayload {
  email: string;
  fullName?: string | null;
  role?: MemberRole;
  preferredSeat?: string | null;
  redirectTo?: string | null;
}

export interface AcceptInvitePayload {
  email: string;
}

export interface InvitationResponse {
  id: string;
  email: string;
  role: MemberRole;
  accepted: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface UpdateMyProfilePayload {
  fullName?: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface MyProfileResponse {
  orgMemberId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: MemberRole;
}
