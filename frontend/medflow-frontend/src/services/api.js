const rawBase = (import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:8085')).trim().replace(/\/$/, '');
const API_BASE = rawBase.endsWith('/api') ? rawBase.slice(0, -4) : rawBase;

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = 'Ocorreu um erro na requisição.';
    try {
      const data = await response.json();
      errorMsg = data.message || data.error || (data.validationErrors ? Object.values(data.validationErrors).join(', ') : errorMsg);
    } catch {
      errorMsg = `Erro ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

/**
 * Autentica o usuário com e-mail e senha.
 */
export async function apiLogin(email, senha) {
  const url = `${API_BASE}/api/auth/login`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: email.trim(), senha }),
  });
  return handleResponse(response);
}

/**
 * Cadastra um novo paciente e retorna a conta autenticada.
 */
export async function apiRegisterPatient(payload) {
  const url = `${API_BASE}/api/auth/registro/paciente`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

/**
 * Cadastra um novo médico com CRM, especialidade e agenda.
 */
export async function apiRegisterDoctor(payload) {
  const url = `${API_BASE}/api/auth/registro/medico`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

/**
 * Atualiza a foto do usuário.
 */
export async function apiUpdatePhoto(usuarioId, fotoBase64) {
  const url = `${API_BASE}/api/usuarios/${usuarioId}/foto`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fotoBase64 }),
  });
  return handleResponse(response);
}

/**
 * Busca as especialidades disponíveis.
 */
export async function apiGetSpecialties() {
  const url = `${API_BASE}/api/especialidades`;
  const response = await fetch(url);
  return handleResponse(response);
}

/**
 * Busca os médicos disponíveis.
 */
export async function apiGetDoctors() {
  const url = `${API_BASE}/api/medicos`;
  const response = await fetch(url);
  return handleResponse(response);
}

export function databaseId(value) {
  const id = String(value ?? '').replace(/^api-[dpc]-/, '');
  if (!/^[1-9][0-9]*$/.test(id)) throw new Error('Cadastro sem vínculo com o banco. Entre novamente com uma conta cadastrada.');
  return Number(id);
}
async function agendaRequest(path, method = 'GET', body) {
  return handleResponse(await fetch(`${API_BASE}/api${path}`, {
    method, headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }));
}
export const apiDoctorCatalog = () => agendaRequest('/medicos/catalogo');
export const apiGetAgenda = (id, date) => agendaRequest(`/medicos/${databaseId(id)}/agenda?data=${encodeURIComponent(date)}`);
export const apiSaveAgenda = (id, date, slots) => agendaRequest(`/medicos/${databaseId(id)}/agenda/${encodeURIComponent(date)}`, 'PUT', { horarios: slots });
export const apiAppointments = (role, id) => agendaRequest(`/consultas/${role}/${databaseId(id)}`);
export const apiBook = (body) => agendaRequest('/consultas', 'POST', body);
export const apiCancel = (id) => agendaRequest(`/consultas/${databaseId(id)}/cancelar`, 'PATCH', { motivo: 'Cancelado pelo usuário' });
export const mapAppointment = (c) => ({ id: `api-c-${c.id}`, doctorId: `api-d-${c.medicoId}`, patientId: `api-p-${c.pacienteId}`, date: c.dataConsulta, time: c.horarioConsulta, status: c.status === 'Nao compareceu' ? 'Não compareceu' : c.status, reason: c.motivo || '', type: c.tipo, createdAt: c.criadoEm });

export const apiReschedule = (id, body) => agendaRequest(`/consultas/${databaseId(id)}`, 'PUT', body);
export const apiStatus = (id, status) => agendaRequest(`/consultas/${databaseId(id)}/status`, 'PATCH', { status: status === 'Não compareceu' ? 'Nao compareceu' : status });
