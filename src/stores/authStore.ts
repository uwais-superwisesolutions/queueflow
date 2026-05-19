import { create } from 'zustand';
import type { AuthResponse, MemberRole } from '@/types';

const TOKEN_KEY = 'token';
const PROFILE_KEY = 'auth';

interface AuthProfile {
  userId: string | null;
  email: string | null;
  fullName: string | null;
  organisationId: string | null;
  organisationName: string | null;
  orgMemberId: string | null;
  role: MemberRole | null;
  onboardingComplete: boolean;
}

interface AuthState extends AuthProfile {
  setSession: (auth: AuthResponse) => void;
  setOnboardingComplete: (value: boolean) => void;
  setOrganisationName: (name: string) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
}

const EMPTY_PROFILE: AuthProfile = {
  userId: null,
  email: null,
  fullName: null,
  organisationId: null,
  organisationName: null,
  orgMemberId: null,
  role: null,
  onboardingComplete: false,
};

function readPersistedProfile(): AuthProfile {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(PROFILE_KEY) : null;
    if (!raw) return EMPTY_PROFILE;
    const parsed = JSON.parse(raw) as Partial<AuthProfile>;
    return { ...EMPTY_PROFILE, ...parsed };
  } catch {
    return EMPTY_PROFILE;
  }
}

function persistProfile(profile: AuthProfile) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...readPersistedProfile(),

  setSession: (auth) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_KEY, auth.accessToken);
    }
    const next: AuthProfile = {
      userId: auth.userId,
      email: auth.email,
      fullName: auth.fullName,
      organisationId: auth.organisationId,
      organisationName: auth.organisationName,
      orgMemberId: auth.orgMemberId,
      role: auth.role,
      onboardingComplete: get().onboardingComplete,
    };
    persistProfile(next);
    set(next);
  },

  setOnboardingComplete: (value) => {
    set((state) => {
      const next: AuthProfile = {
        userId: state.userId,
        email: state.email,
        fullName: state.fullName,
        organisationId: state.organisationId,
        organisationName: state.organisationName,
        orgMemberId: state.orgMemberId,
        role: state.role,
        onboardingComplete: value,
      };
      persistProfile(next);
      return next;
    });
  },

  setOrganisationName: (name) => {
    set((state) => {
      const next: AuthProfile = {
        userId: state.userId,
        email: state.email,
        fullName: state.fullName,
        organisationId: state.organisationId,
        organisationName: name,
        orgMemberId: state.orgMemberId,
        role: state.role,
        onboardingComplete: state.onboardingComplete,
      };
      persistProfile(next);
      return { organisationName: name };
    });
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(PROFILE_KEY);
    }
    set(EMPTY_PROFILE);
  },

  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.localStorage.getItem(TOKEN_KEY));
  },
}));
