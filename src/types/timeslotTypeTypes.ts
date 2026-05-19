export interface CreateTimeslotTypePayload {
  name: string;
  durationMinutes: number;
  color?: string | null;
}

export type UpdateTimeslotTypePayload = CreateTimeslotTypePayload;

export interface SetTimeslotTypeActivePayload {
  isActive: boolean;
}

export interface TimeslotTypeResponse {
  id: string;
  name: string;
  durationMinutes: number;
  color: string | null;
  isActive: boolean;
  createdAt: string;
}
