import { describe, it, expect } from 'vitest';
import { createMockData } from '../data/mockData';
import {
  bookAppointment,
  changeAppointmentStatus,
  slotUnavailable,
  patientError,
} from '../utils/appointments';
import { today, addDays } from '../utils/date';
const input = (data) => ({
  patient: data.patients[0],
  doctorId: 'd1',
  date: addDays(today(), 3),
  time: '16:00',
  reason: 'Consulta fictícia',
});
describe('Estado global da aplicação', () => {
  it('contém as quantidades e relações solicitadas', () => {
    const d = createMockData();
    expect(d.patients).toHaveLength(10);
    expect(d.doctors).toHaveLength(8);
    expect(d.specialties).toHaveLength(8);
    expect(d.appointments).toHaveLength(20);
    expect(d.records).toHaveLength(10);
    for (const a of d.appointments) {
      expect(d.patients.some((p) => p.id === a.patientId)).toBe(true);
      expect(d.doctors.some((p) => p.id === a.doctorId)).toBe(true);
    }
  });
  it('cria uma única consulta visível nos seletores das três áreas', () => {
    const seed = createMockData();
    const { data, appointment } = bookAppointment(seed, input(seed));
    expect(seed.appointments).toHaveLength(20);
    expect(data.appointments).toHaveLength(21);
    expect(data.appointments.filter((a) => a.patientId === 'p1')).toContainEqual(appointment);
    expect(data.appointments.filter((a) => a.doctorId === 'd1')).toContainEqual(appointment);
    expect(data.appointments).toContainEqual(appointment);
  });
  it('impede conflito do profissional e mantém original intacto', () => {
    const seed = createMockData();
    const booked = bookAppointment(seed, input(seed)).data;
    expect(() => bookAppointment(booked, { ...input(seed), patient: seed.patients[1] })).toThrow(
      'indisponível',
    );
    expect(booked.appointments).toHaveLength(21);
  });
  it('impede paciente simultâneo com outro profissional', () => {
    const seed = createMockData();
    const booked = bookAppointment(seed, input(seed)).data;
    expect(() => bookAppointment(booked, { ...input(seed), doctorId: 'd2' })).toThrow(
      'paciente já possui',
    );
  });
  it('reagenda preservando ID e liberando o slot antigo', () => {
    const seed = createMockData();
    const first = bookAppointment(seed, input(seed));
    const second = bookAppointment(first.data, {
      ...input(seed),
      id: first.appointment.id,
      time: '16:30',
    });
    expect(second.data.appointments).toHaveLength(21);
    expect(second.appointment.id).toBe(first.appointment.id);
    expect(slotUnavailable(second.data, 'd1', input(seed).date, '16:00')).toBe(false);
  });
  it('cancelamento libera vaga e notifica ambos os perfis', () => {
    const seed = createMockData();
    const result = bookAppointment(seed, input(seed));
    const d = changeAppointmentStatus(result.data, result.appointment.id, 'Cancelado');
    expect(slotUnavailable(d, 'd1', input(seed).date, '16:00')).toBe(false);
    expect(d.notifications[0].patientId).toBe('p1');
    expect(d.notifications[0].doctorId).toBe('d1');
    expect(() => changeAppointmentStatus(d, result.appointment.id, 'Em atendimento')).toThrow();
  });
  it('iniciar atendimento cria prontuário para novo vínculo', () => {
    const seed = createMockData();
    const result = bookAppointment(seed, { ...input(seed), doctorId: 'd2' });
    const started = changeAppointmentStatus(result.data, result.appointment.id, 'Em atendimento');
    expect(started.records.some((r) => r.patientId === 'p1' && r.doctorId === 'd2')).toBe(true);
    const completed = changeAppointmentStatus(started, result.appointment.id, 'Concluído');
    expect(completed.appointments.find((a) => a.id === result.appointment.id).status).toBe(
      'Concluído',
    );
  });
  it('valida entrada e horários indisponíveis', () => {
    const d = createMockData();
    expect(patientError({ ...d.patients[0], cpf: '123' })).toContain('11 dígitos');
    expect(patientError({ ...d.patients[0], birth: '2026-02-31' })).not.toBe('');
    expect(() => bookAppointment(d, { ...input(d), doctorId: 'missing' })).toThrow();
    for (const time of ['07:30', '12:00', '12:30', '18:00', '16:15'])
      expect(() => bookAppointment(d, { ...input(d), time })).toThrow();
    expect(() => bookAppointment(d, { ...input(d), date: addDays(today(), -1) })).toThrow();
  });
});
