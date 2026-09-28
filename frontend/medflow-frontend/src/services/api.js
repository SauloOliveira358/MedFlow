const rawBase = (import.meta.env.VITE_API_URL || 'http://localhost:8085').trim().replace(/\/$/, '');
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
 * Autentica o usuário com email e senha no banco de dados.
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
 * Cadastra um novo paciente no banco de dados e retorna a conta autenticada.
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
 * Cadastra um novo médico no banco de dados com CRM, especialidade e agenda.
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
 * Atualiza a foto do usuário diretamente no banco de dados (Base64).
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
 * Busca todas as especialidades salvas no banco de dados.
 */
export async function apiGetSpecialties() {
  const url = `${API_BASE}/api/especialidades`;
  const response = await fetch(url);
  return handleResponse(response);
}

/**
 * Busca todos os médicos salvos no banco de dados.
 */
export async function apiGetDoctors() {
  const url = `${API_BASE}/api/medicos`;
  const response = await fetch(url);
  return handleResponse(response);
}
