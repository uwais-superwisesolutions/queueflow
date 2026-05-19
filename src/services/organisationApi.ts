import api from './interceptor';
import type {
  AcceptInvitePayload,
  InvitationResponse,
  InviteUserPayload,
  MemberResponse,
  OrganisationResponse,
  UpdateBrandingPayload,
  UpdateOnboardingStepPayload,
} from '@/types';

export function getOrganisation() {
  return api.request<OrganisationResponse>({
    url: '/secure/organisations',
    method: 'GET',
  });
}

export function updateBranding(payload: UpdateBrandingPayload) {
  return api.request<OrganisationResponse>({
    url: '/secure/organisations/branding',
    method: 'PATCH',
    data: payload,
  });
}

export function updateOnboardingStep(payload: UpdateOnboardingStepPayload) {
  return api.request<OrganisationResponse>({
    url: '/secure/organisations/onboarding-step',
    method: 'PATCH',
    data: payload,
  });
}

export function completeOnboarding() {
  return api.request<OrganisationResponse>({
    url: '/secure/organisations/complete-onboarding',
    method: 'POST',
  });
}

export function getMembers() {
  return api.request<MemberResponse[]>({
    url: '/secure/organisations/members',
    method: 'GET',
  });
}

export function inviteUser(payload: InviteUserPayload) {
  return api.request<{ message: string }>({
    url: '/secure/organisations/invite',
    method: 'POST',
    data: payload,
  });
}

export function acceptInvite(payload: AcceptInvitePayload) {
  return api.request<{ message: string }>({
    url: '/secure/organisations/accept-invite',
    method: 'POST',
    data: payload,
  });
}

export function getInvitations() {
  return api.request<InvitationResponse[]>({
    url: '/secure/organisations/invitations',
    method: 'GET',
  });
}
