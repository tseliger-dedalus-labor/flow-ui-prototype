/**
 * Beschreibt einen Stations-Termin aus dem Appointments-Backend.
 */
export interface Appointment {
  id: string;
  wardId: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  reason: string;
}
