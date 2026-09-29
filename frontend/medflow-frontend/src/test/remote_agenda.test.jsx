import { it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { DemoProvider, useDemo } from '../context/DemoContext';
import { createMockData } from '../data/mockData';
function Probe() {
  const { data, saveDoctorSchedule, notify } = useDemo();
  return <><span>Banco: {data.doctors[0]?.name}</span>
    <span data-testid="slots">{JSON.stringify(data.doctorSchedules)}</span>
    <button onClick={() => saveDoctorSchedule('api-d-12', '2030-01-10', ['09:00']).catch(e => notify(e.message, 'error'))}>Salvar</button>
  </>;
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.__VITEST__ = true; localStorage.clear(); sessionStorage.clear(); });
it('usa a API no provider real e só publica horários após a gravação confirmada', async () => {
  window.__VITEST__ = false;
  localStorage.setItem('medflow-react-v3', JSON.stringify({ ...createMockData(), version: 3,
    accounts: [{ id: 'user-1', doctorId: 'api-d-12', role: 'medico' }] }));
  sessionStorage.setItem('medflow-session-v1', 'user-1');
  let rejectSave = true;
  let saved = [];
  const fetch = vi.fn(async (url, options = {}) => {
    let body;
    if (url.endsWith('/catalogo')) body = [{ id: 'api-d-12', name: 'Médico do banco', specialtyId: '1' }];
    else if (url.endsWith('/especialidades')) body = [{ id: 1, nome: 'Especialidade real' }];
    else if (url.includes('/consultas/')) body = [];
    else if (options.method === 'PUT') {
      if (rejectSave) return { ok: false, json: async () => ({ message: 'Falha ao salvar' }) };
      saved = JSON.parse(options.body).horarios;
      body = {};
    } else body = { data: '2030-01-10', horarios: saved.map(horario => ({ horario, disponivel: true })) };
    return { ok: true, json: async () => body };
  });
  vi.stubGlobal('fetch', fetch);
  render(<DemoProvider><Probe /></DemoProvider>);
  await screen.findByText('Banco: Médico do banco');
  fireEvent.click(screen.getByText('Salvar'));
  await waitFor(() => expect(fetch.mock.calls.some(([, o]) => o?.method === 'PUT')).toBe(true));
  expect(screen.getByTestId('slots').textContent).toBe('[]');
  rejectSave = false;
  fireEvent.click(screen.getByText('Salvar'));
  await waitFor(() => expect(screen.getByTestId('slots').textContent).toContain('09:00'));
  expect(saved).toEqual(['09:00']);
});
