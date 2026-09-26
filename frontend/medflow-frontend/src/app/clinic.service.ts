import { Injectable, signal } from '@angular/core';
import { Appointment, ClinicData, localDate } from './models';
export function seedData(): ClinicData {
  return {
    patients: [
      {
        id: 'p1',
        name: 'Mariana Costa',
        email: 'mariana@example.com',
        phone: '11999990001',
        birth: '1992-05-18',
      },
      {
        id: 'p2',
        name: 'Pedro Almeida',
        email: 'pedro@example.com',
        phone: '11999990002',
        birth: '1985-09-12',
      },
      {
        id: 'p3',
        name: 'Ana Beatriz Santos',
        email: 'ana@example.com',
        phone: '11999990003',
        birth: '1998-02-24',
      },
      {
        id: 'p4',
        name: 'Lucas Oliveira',
        email: 'lucas@example.com',
        phone: '11999990004',
        birth: '1979-11-03',
      },
    ],
    specialties: [
      { id: 's1', name: 'Clínica geral' },
      { id: 's2', name: 'Cardiologia' },
      { id: 's3', name: 'Dermatologia' },
    ],
    professionals: [
      {
        id: 'd1',
        name: 'Camila Ribeiro',
        specialtyId: 's1',
        crm: '123456-SP',
        start: '08:00',
        end: '18:00',
      },
      {
        id: 'd2',
        name: 'Rafael Mendes',
        specialtyId: 's2',
        crm: '234567-SP',
        start: '08:00',
        end: '17:00',
      },
      {
        id: 'd3',
        name: 'Isabela Martins',
        specialtyId: 's3',
        crm: '345678-SP',
        start: '09:00',
        end: '18:00',
      },
    ],
    users: [{ id: 'u1', name: 'Alex Morgan', email: 'admin@medflow.demo', role: 'Administrador' }],
    appointments: [
      {
        id: 'a1',
        patientId: 'p1',
        professionalId: 'd1',
        date: localDate(),
        time: '09:00',
        status: 'Confirmado',
        notes: '',
      },
      {
        id: 'a2',
        patientId: 'p2',
        professionalId: 'd2',
        date: localDate(),
        time: '10:30',
        status: 'Confirmado',
        notes: '',
      },
      {
        id: 'a3',
        patientId: 'p3',
        professionalId: 'd3',
        date: localDate(),
        time: '11:00',
        status: 'Confirmado',
        notes: '',
      },
      {
        id: 'a4',
        patientId: 'p4',
        professionalId: 'd1',
        date: localDate(),
        time: '08:00',
        status: 'Concluído',
        notes: '',
      },
    ],
    history: [],
  };
}
export function appointmentError(data: ClinicData, item: Appointment): string {
  const professional = data.professionals.find((p) => p.id === item.professionalId);
  if (!professional || !data.patients.some((p) => p.id === item.patientId))
    return 'Selecione um paciente e um profissional válidos.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date) || item.date < localDate())
    return 'Escolha uma data a partir de hoje.';
  if (
    !/^\d{2}:(00|30)$/.test(item.time) ||
    item.time < professional.start ||
    item.time >= professional.end
  )
    return 'Escolha um horário disponível de 30 minutos dentro do expediente.';
  if (
    data.appointments.some(
      (a) =>
        a.id !== item.id &&
        a.status !== 'Cancelado' &&
        a.date === item.date &&
        a.time === item.time &&
        a.professionalId === item.professionalId,
    )
  )
    return 'Este horário já está ocupado. Selecione outro horário.';
  return '';
}
@Injectable({ providedIn: 'root' })
export class ClinicService {
  readonly data = signal<ClinicData>(seedData());
  readonly storageWarning = signal('');
  constructor() {
    try {
      const raw = localStorage.getItem('medflow-demo-v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (this.validData(parsed)) this.data.set(parsed);
        else
          this.storageWarning.set(
            'Dados locais incompatíveis. Uma nova demonstração foi carregada.',
          );
      }
    } catch {
      this.storageWarning.set(
        'Armazenamento local indisponível. As alterações funcionarão apenas nesta sessão.',
      );
    }
  }
  private validData(value: unknown): value is ClinicData {
    if (!value || typeof value !== 'object') return false;
    const schema = {
      patients: ['id', 'name', 'email', 'phone', 'birth'],
      professionals: ['id', 'name', 'specialtyId', 'crm', 'start', 'end'],
      specialties: ['id', 'name'],
      users: ['id', 'name', 'email', 'role'],
      appointments: ['id', 'patientId', 'professionalId', 'date', 'time', 'status', 'notes'],
      history: ['id', 'at', 'text'],
    };
    return Object.entries(schema).every(([key, fields]) => {
      const rows = (value as Record<string, unknown>)[key];
      return (
        Array.isArray(rows) &&
        rows.every((row) => row && fields.every((field) => typeof row[field] === 'string'))
      );
    });
  }
  save(next: ClinicData, text: string) {
    next = {
      ...next,
      history: [{ id: crypto.randomUUID(), at: new Date().toISOString(), text }, ...next.history],
    };
    this.data.set(next);
    try {
      localStorage.setItem('medflow-demo-v1', JSON.stringify(next));
    } catch {
      this.storageWarning.set(
        'Não foi possível salvar no navegador. Alterações mantidas somente nesta sessão.',
      );
    }
  }
  saveAppointment(item: Appointment): string {
    const error = appointmentError(this.data(), item);
    if (error) return error;
    const exists = this.data().appointments.some((a) => a.id === item.id);
    this.save(
      {
        ...this.data(),
        appointments: exists
          ? this.data().appointments.map((a) => (a.id === item.id ? item : a))
          : [...this.data().appointments, item],
      },
      `Agendamento ${exists ? 'alterado' : 'criado'} para ${item.date} às ${item.time}.`,
    );
    return '';
  }
}
