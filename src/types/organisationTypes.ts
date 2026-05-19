import type { MemberRole } from './authTypes';

export interface OrganisationResponse {
  id: string;
  name: string;
  industry: string | null;
  logoUrl: string | null;
  brandColor: string | null;
  onboardingStep: string | null;
  onboardingComplete: boolean;
  createdAt: string;
}

export interface UpdateBrandingPayload {
  industry?: string | null;
  logoUrl?: string | null;
  brandColor?: string | null;
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
