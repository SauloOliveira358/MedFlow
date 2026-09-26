export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  birth: string;
}
export interface Specialty {
  id: string;
  name: string;
}
export interface Professional {
  id: string;
  name: string;
  specialtyId: string;
  crm: string;
  start: string;
  end: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Administrador' | 'Recepção';
}
export type Status = 'Confirmado' | 'Concluído' | 'Cancelado';
export interface Appointment {
  id: string;
  patientId: string;
  professionalId: string;
  date: string;
  time: string;
  status: Status;
  notes: string;
}
export interface HistoryEntry {
  id: string;
  at: string;
  text: string;
}
export interface ClinicData {
  patients: Patient[];
  professionals: Professional[];
  specialties: Specialty[];
  users: User[];
  appointments: Appointment[];
  history: HistoryEntry[];
}
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
