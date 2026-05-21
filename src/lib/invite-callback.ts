/**
 * Supabase's invite email sends users to <site>/#access_token=...&type=invite&...
 *
 * The hash fragment is opaque to React Router (we use createBrowserRouter, not
 * the hash router). This module runs once during bootstrap, detects an invite
 * callback, stows the access + refresh tokens in localStorage so the axios
 * interceptor can use them, drops a sessionStorage flag so `/accept-invite`
 * knows to start at the password step, and rewrites the URL so the hash
 * doesn't linger in the address bar.
 *
 * Only `type=invite` is consumed today. The same hash shape is also produced by
 * Supabase's password-reset and email-change flows — those can hook in here
 * later by checking `params.get('type')`.
 */

const ORG_TOKEN_KEY = 'token';
const ORG_REFRESH_TOKEN_KEY = 'refresh_token';
export const INVITE_PENDING_FLAG = 'invite-callback:pending';
export const RECOVERY_PENDING_FLAG = 'recovery-callback:pending';

interface DecodedInvitePayload {
  email?: string;
  sub?: string;
  user_metadata?: {
    org_id?: string;
    role?: string;
  };
}

function decodeJwtPayload(token: string): DecodedInvitePayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    const json = atob(padded);
    return JSON.parse(json) as DecodedInvitePayload;
  } catch {
    return null;
  }
}

/**
 * Returns true if an invite callback was detected and handled. Call BEFORE the
 * router mounts. Side effects: writes to localStorage + sessionStorage and
 * rewrites the URL.
 */
export function consumeInviteCallback(): boolean {
  if (typeof window === 'undefined') return false;

  const hash = window.location.hash;
  if (!hash.startsWith('#') || !hash.includes('access_token=')) return false;

  const params = new URLSearchParams(hash.slice(1));
  if (params.get('type') !== 'invite') return false;

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken) return false;

  localStorage.setItem(ORG_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(ORG_REFRESH_TOKEN_KEY, refreshToken);

  // Decode the JWT to seed the auth-store profile with what we can (email,
  // userId). The org_members row only exists after AcceptInvite, so org name
  // / member id come later — this is a partial seed, not a full session.
  const claims = decodeJwtPayload(accessToken);
  if (claims) {
    const profile = {
      userId: claims.sub ?? null,
      email: claims.email ?? null,
      fullName: null,
      organisationId: claims.user_metadata?.org_id ?? null,
      organisationName: null,
      orgMemberId: null,
      role: claims.user_metadata?.role ?? null,
      onboardingComplete: false,
    };
    localStorage.setItem('auth', JSON.stringify(profile));
  }

  sessionStorage.setItem(INVITE_PENDING_FLAG, '1');

  // If we're already on /accept-invite (Supabase redirected here directly),
  // just strip any leftover hash/search and let the page render normally.
  if (window.location.pathname === '/accept-invite') {
    window.history.replaceState(null, '', '/accept-invite');
    return true;
  }

  // We're on a different path (e.g. '/') — do a hard redirect so the router
  // re-initialises at /accept-invite. replaceState alone doesn't re-trigger
  // createBrowserRouter's route matching after it has already mounted.
  window.location.replace('/accept-invite');

  return true;
}

/**
 * Mirror of `consumeInviteCallback` for the password-recovery hash that
 * Supabase appends when the user clicks the reset link in their email.
 * Format: <site>/reset-password#access_token=...&type=recovery&refresh_token=...
 *
 * Side effects: writes the recovery access token to localStorage so the next
 * /secure call (specifically POST /secure/auth/update-password) is authorised,
 * drops a sessionStorage flag, strips the hash, and forces the user onto
 * /reset-password if they happened to land elsewhere.
 */
export function consumeRecoveryCallback(): boolean {
  if (typeof window === 'undefined') return false;

  const hash = window.location.hash;
  if (!hash.startsWith('#') || !hash.includes('access_token=')) return false;

  const params = new URLSearchParams(hash.slice(1));
  if (params.get('type') !== 'recovery') return false;

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken) return false;

  localStorage.setItem(ORG_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(ORG_REFRESH_TOKEN_KEY, refreshToken);

  // Seed the auth-store profile just enough that POST /secure/auth/update-password
  // works. We deliberately leave organisationId / orgMemberId etc. unset — the
  // user will land back at /login afterwards and re-authenticate.
  const claims = decodeJwtPayload(accessToken);
  if (claims) {
    const profile = {
      userId: claims.sub ?? null,
      email: claims.email ?? null,
      fullName: null,
      organisationId: null,
      organisationName: null,
      orgMemberId: null,
      role: null,
      onboardingComplete: false,
    };
    localStorage.setItem('auth', JSON.stringify(profile));
  }

  sessionStorage.setItem(RECOVERY_PENDING_FLAG, '1');

  if (window.location.pathname === '/reset-password') {
    window.history.replaceState(null, '', '/reset-password');
    return true;
  }

  window.location.replace('/reset-password');
  return true;
}
