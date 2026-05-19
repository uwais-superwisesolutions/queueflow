export interface CreateDepartmentPayload {
  name: string;
  displayOrder: number;
}

export type UpdateDepartmentPayload = CreateDepartmentPayload;

export interface DepartmentResponse {
  id: string;
  name: string;
  displayOrder: number;
  createdAt: string;
}
