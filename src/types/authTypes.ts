export type MemberRole = 'super_user' | 'org_user';

export interface SignUpPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  orgName: string;
  industry?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  email: string;
  fullName: string;
  organisationId: string | null;
  organisationName: string | null;
  orgMemberId: string | null;
  role: MemberRole | null;
}

// Backend error shapes. Standard endpoints return { message }.
// Supabase-originated auth errors return { displayMessage, errorCode }.
export interface ApiErrorBody {
  message?: string;
  displayMessage?: string;
  errorCode?: string;
}
