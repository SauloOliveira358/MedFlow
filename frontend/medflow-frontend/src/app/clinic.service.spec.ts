import { appointmentError, ClinicService, seedData } from './clinic.service';
import { Appointment, localDate } from './models';
describe('Agenda demonstrativa', () => {
  const candidate = (): Appointment => ({
    id: 'new',
    patientId: 'p1',
    professionalId: 'd1',
    date: localDate(),
    time: '12:00',
    status: 'Confirmado',
    notes: '',
  });
  beforeEach(() => localStorage.clear());
  it('permite horário livre e bloqueia conflito do mesmo profissional', () => {
    const data = seedData();
    expect(appointmentError(data, candidate())).toBe('');
    expect(appointmentError(data, { ...candidate(), time: '09:00' })).toContain('ocupado');
    expect(appointmentError(data, { ...candidate(), professionalId: 'd2', time: '09:00' })).toBe(
      '',
    );
  });
  it('rejeita paciente inexistente, passado e horários fora do expediente', () => {
    const data = seedData();
    expect(appointmentError(data, { ...candidate(), patientId: 'missing' })).toContain('válidos');
    expect(appointmentError(data, { ...candidate(), date: '2000-01-01' })).toContain('hoje');
    for (const time of ['07:30', '18:00', '12:15'])
      expect(appointmentError(data, { ...candidate(), time })).toContain('expediente');
  });
  it('libera horário cancelado e permite editar a própria reserva', () => {
    const data = seedData();
    expect(appointmentError(data, data.appointments[0])).toBe('');
    data.appointments[0].status = 'Cancelado';
    expect(appointmentError(data, { ...candidate(), time: '09:00' })).toBe('');
  });
  it('persiste remarcação sem duplicar e registra histórico', () => {
    const service = new ClinicService();
    expect(service.saveAppointment({ ...service.data().appointments[0], time: '14:00' })).toBe('');
    const restored = new ClinicService();
    expect(restored.data().appointments.length).toBe(4);
    expect(restored.data().appointments[0].time).toBe('14:00');
    expect(restored.data().history.length).toBe(1);
  });
  it('não altera dados quando há conflito', () => {
    const service = new ClinicService();
    const before = service.data();
    expect(service.saveAppointment({ ...candidate(), time: '09:00' })).not.toBe('');
    expect(service.data()).toBe(before);
  });
  it('recupera armazenamento inválido', () => {
    localStorage.setItem('medflow-demo-v1', '{broken');
    const service = new ClinicService();
    expect(service.data().patients.length).toBe(4);
    expect(service.storageWarning()).not.toBe('');
  });
});
