import { create } from 'zustand';
import type { PhoneConfirmResponse } from '@/types';

const TOKEN_KEY = 'client_token';
const PROFILE_KEY = 'client_auth';

interface ClientAuthProfile {
  clientId: string | null;
  orgId: string | null;
  phone: string | null;
  expiresAt: string | null;
}

interface ClientAuthState extends ClientAuthProfile {
  setSession: (response: PhoneConfirmResponse, orgId: string, phone: string) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
}

const EMPTY: ClientAuthProfile = {
  clientId: null,
  orgId: null,
  phone: null,
  expiresAt: null,
};

function read(): ClientAuthProfile {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(PROFILE_KEY) : null;
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<ClientAuthProfile>) };
  } catch {
    return EMPTY;
  }
}

function persist(profile: ClientAuthProfile) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export const useClientAuthStore = create<ClientAuthState>((set) => ({
  ...read(),

  setSession: (response, orgId, phone) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_KEY, response.token);
    }
    const profile: ClientAuthProfile = {
      clientId: response.clientId,
      orgId,
      phone,
      expiresAt: response.expiresAt,
    };
    persist(profile);
    set(profile);
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(PROFILE_KEY);
    }
    set(EMPTY);
  },

  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    const token = window.localStorage.getItem(TOKEN_KEY);
    const exp = read().expiresAt;
    if (!token || !exp) return false;
    return new Date(exp).getTime() > Date.now();
  },
}));
