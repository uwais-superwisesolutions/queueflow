export interface CreateSeatPayload {
  departmentId: string;
  name: string;
  description?: string | null;
  requiresApproval: boolean;
  displayOrder: number;
}

export type UpdateSeatPayload = CreateSeatPayload;

export interface SeatResponse {
  id: string;
  departmentId: string;
  name: string;
  description: string | null;
  requiresApproval: boolean;
  displayOrder: number;
  createdAt: string;
}
