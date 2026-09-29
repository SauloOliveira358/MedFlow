import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiSaveAgenda, apiBook, apiCancel, databaseId, mapAppointment } from '../services/api';
import { slotUnavailable } from '../utils/appointments';

afterEach(() => vi.unstubAllGlobals());
describe('integração da agenda com a API', () => {
  it('salva horários usando ID real e corpo do backend', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ horarios: [] }) });
    vi.stubGlobal('fetch', fetch);
    await apiSaveAgenda('api-d-12', '2030-01-10', ['09:00']);
    expect(fetch.mock.calls[0][0]).toMatch(/\/api\/medicos\/12\/agenda\/2030-01-10$/);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ horarios: ['09:00'] });
    expect(fetch.mock.calls[0][1].method).toBe('PUT');
  });
  it('propaga conflito ao confirmar, sem simular sucesso local', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ message: 'Horário indisponível.' }) }));
    await expect(apiBook({ medicoId: 12 })).rejects.toThrow('Horário indisponível');
  });
  it('cancela pelo ID persistido e mapeia os vínculos da consulta', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal('fetch', fetch);
    await apiCancel('api-c-31');
    expect(fetch.mock.calls[0][0]).toMatch(/\/consultas\/31\/cancelar$/);
    expect(mapAppointment({ id: 31, medicoId: 12, pacienteId: 8, status: 'Confirmado' }))
      .toMatchObject({ id: 'api-c-31', doctorId: 'api-d-12', patientId: 'api-p-8', status: 'Confirmado' });
    expect(() => databaseId('mock-doctor')).toThrow();
  });
  it('bloqueia disponibilidade negada pelo banco mesmo sem conhecer a consulta de outro paciente', () => {
    const data = { doctors: [{ id: 'api-d-12' }], appointments: [], doctorSchedules: [
      { doctorId: 'api-d-12', date: '2030-01-10', slots: ['09:00', '10:00'], unavailable: ['09:00'] },
    ] };
    expect(slotUnavailable(data, 'api-d-12', '2030-01-10', '09:00')).toBe(true);
    expect(slotUnavailable(data, 'api-d-12', '2030-01-10', '10:00')).toBe(false);
  });
});
