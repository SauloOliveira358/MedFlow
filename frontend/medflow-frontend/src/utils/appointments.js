import { active, today, validDate } from './date';
export const allSlots = Array.from(
  { length: 20 },
  (_, i) => `${String(8 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
);
export function slotUnavailable(data, doctorId, date, time, excludeId, now = new Date()) {
  const doctor = data.doctors.find((d) => d.id === doctorId);
  return (
    !doctor ||
    !validDate(date) ||
    date < today() ||
    time < doctor.start ||
    time >= doctor.end ||
    time === '12:00' ||
    time === '12:30' ||
    (date === today() && time <= now.toTimeString().slice(0, 5)) ||
    data.appointments.some(
      (a) =>
        a.id !== excludeId &&
        a.doctorId === doctorId &&
        a.date === date &&
        a.time === time &&
        a.status !== 'Cancelado',
    )
  );
}
export function patientError(p) {
  if (!p.name?.trim() || p.name.trim().length < 3) return 'Informe seu nome completo.';
  if (!validDate(p.birth) || p.birth > today() || p.birth < '1900-01-01')
    return 'Confira a data de nascimento.';
  if (!/^\d{10,11}$/.test((p.phone || '').replace(/\D/g, '')))
    return 'Informe um telefone com DDD.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email || '')) return 'Informe um e-mail válido.';
  if (!/^\d{11}$/.test((p.cpf || '').replace(/\D/g, '')))
    return 'Informe os 11 dígitos do CPF fictício.';
  return '';
}
export function bookAppointment(data, input) {
  const existing = input.id ? data.appointments.find((a) => a.id === input.id) : null;
  if (input.id && (!existing || !['Confirmado', 'Pendente'].includes(existing.status)))
    throw new Error('Este agendamento não pode mais ser alterado.');
  const patient = input.patient || data.patients.find((p) => p.id === input.patientId);
  const error = patientError(patient || {});
  if (error) throw new Error(error);
  if (!data.doctors.some((d) => d.id === input.doctorId))
    throw new Error('Selecione um profissional.');
  if (
    !allSlots.includes(input.time) ||
    slotUnavailable(data, input.doctorId, input.date, input.time, input.id)
  )
    throw new Error('Este horário está indisponível. Escolha outro horário.');
  if (existing && existing.patientId !== patient.id)
    throw new Error('O paciente da consulta não pode ser alterado.');
  const id = existing?.id || crypto.randomUUID();
  const patientId = patient.id || crypto.randomUUID();
  if (
    data.appointments.some(
      (a) =>
        a.id !== id &&
        a.patientId === patientId &&
        a.date === input.date &&
        a.time === input.time &&
        active(a),
    )
  )
    throw new Error('O paciente já possui uma consulta neste horário.');
  const appt = {
    id,
    patientId,
    doctorId: input.doctorId,
    date: input.date,
    time: input.time,
    reason: input.reason?.trim() || '',
    status: 'Confirmado',
    type: existing?.type || 'Consulta',
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  const person = { ...patient, id: patientId, name: patient.name.trim() };
  const notification = {
    id: crypto.randomUUID(),
    patientId,
    doctorId: appt.doctorId,
    title: existing ? 'Consulta reagendada' : 'Consulta confirmada',
    message: `${data.doctors.find((d) => d.id === appt.doctorId).name} · ${appt.date.split('-').reverse().join('/')} às ${appt.time}`,
    at: new Date().toISOString(),
    readBy: [],
  };
  return {
    data: {
      ...data,
      patients: data.patients.some((p) => p.id === patientId)
        ? data.patients.map((p) => (p.id === patientId ? person : p))
        : [...data.patients, person],
      appointments: existing
        ? data.appointments.map((a) => (a.id === id ? appt : a))
        : [...data.appointments, appt],
      notifications: [notification, ...data.notifications],
    },
    appointment: appt,
  };
}
export function changeAppointmentStatus(data, id, status) {
  const appointment = data.appointments.find((a) => a.id === id);
  const allowed = {
    Confirmado: ['Cancelado', 'Em atendimento'],
    Pendente: ['Cancelado', 'Em atendimento'],
    'Em atendimento': ['Concluído', 'Cancelado'],
  };
  if (!appointment || !allowed[appointment.status]?.includes(status))
    throw new Error('Esta ação não está disponível para o status atual.');
  let records = data.records;
  if (
    status === 'Em atendimento' &&
    !records.some(
      (r) => r.patientId === appointment.patientId && r.doctorId === appointment.doctorId,
    )
  )
    records = [
      ...records,
      {
        id: crypto.randomUUID(),
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        updatedAt: new Date().toISOString(),
        summary: 'Novo acompanhamento demonstrativo.',
        notes: [],
        procedures: [],
        documents: [],
      },
    ];
  return {
    ...data,
    records,
    appointments: data.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
    notifications: [
      {
        id: crypto.randomUUID(),
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        title: `Consulta: ${status.toLowerCase()}`,
        message: `${appointment.date.split('-').reverse().join('/')} às ${appointment.time}`,
        at: new Date().toISOString(),
        readBy: [],
      },
      ...data.notifications,
    ],
  };
}
