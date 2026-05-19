export interface CreatePublicHolidayPayload {
  date: string; // "YYYY-MM-DD"
  name: string;
}

export interface PublicHolidayResponse {
  id: string;
  date: string;
  name: string;
}
