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
