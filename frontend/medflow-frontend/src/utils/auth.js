import { patientError } from './appointments';
export const normalizeEmail = (email) =>
  String(email || '')
    .trim()
    .toLowerCase();
export function requireRole(account, role) {
  if (!account || account.role !== role)
    throw new Error('Você não tem permissão para realizar esta ação.');
}
export async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('');
}
export async function credentials(email, password) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email)))
    throw new Error('Informe um e-mail válido.');
  if (typeof password !== 'string' || password.length < 8)
    throw new Error('Use uma senha com pelo menos 8 caracteres.');
  const salt = crypto.randomUUID();
  return { email: normalizeEmail(email), salt, passwordHash: await passwordHash(password, salt) };
}
function assertUnique(data, email) {
  if (data.accounts.some((a) => a.email === normalizeEmail(email)))
    throw new Error('Este e-mail já possui uma conta. Entre com sua senha.');
}
export async function patientRegistration(data, form) {
  const error = patientError(form);
  if (error) throw new Error(error);
  assertUnique(data, form.email);
  if (data.patients.some((p) => normalizeEmail(p.email) === normalizeEmail(form.email)))
    throw new Error(
      'Já existe um cadastro com esse e-mail. Entre em contato com a clínica para vincular seu acesso.',
    );
  const auth = await credentials(form.email, form.password);
  const patient = {
    id: crypto.randomUUID(),
    name: form.name.trim(),
    birth: form.birth,
    phone: form.phone,
    email: auth.email,
    cpf: form.cpf,
    photo: '',
  };
  const account = { id: crypto.randomUUID(), role: 'paciente', patientId: patient.id, ...auth };
  return { patient, account };
}
export async function doctorRegistration(data, actor, form) {
  requireRole(actor, 'clinica');
  assertUnique(data, form.email);
  if (!form.name?.trim() || form.name.trim().length < 3)
    throw new Error('Informe o nome do profissional.');
  if (!form.registration?.trim()) throw new Error('Informe o registro profissional.');
  if (!data.specialties.some((s) => s.id === form.specialtyId))
    throw new Error('Selecione uma especialidade válida.');
  if (!/^\d{10,11}$/.test((form.phone || '').replace(/\D/g, '')))
    throw new Error('Informe o telefone com DDD.');
  if (
    data.doctors.some(
      (d) => d.registration.toLowerCase() === form.registration.trim().toLowerCase(),
    )
  )
    throw new Error('Este registro profissional já está cadastrado.');
  const auth = await credentials(form.email, form.password);
  const doctor = {
    id: crypto.randomUUID(),
    name: form.name.trim(),
    firstName: form.name.trim().split(' ').slice(0, 2).join(' '),
    specialtyId: form.specialtyId,
    registration: form.registration.trim(),
    email: auth.email,
    phone: form.phone,
    city: form.city?.trim() || 'Belo Horizonte, MG',
    clinic: form.clinic?.trim() || data.clinic?.name || 'Clínica MedFlow',
    address: form.address?.trim() || data.clinic?.address || 'Rua das Flores, 120 · Funcionários, Belo Horizonte - MG',
    lat: typeof form.lat === 'number' ? form.lat : (data.clinic?.lat ?? -19.9227),
    lng: typeof form.lng === 'number' ? form.lng : (data.clinic?.lng ?? -43.9451),
    start: '08:00',
    end: '18:00',
    photo: '',
    rating: 'Novo',
    bio: 'Um atendimento acolhedor, com tempo para ouvir você.',
  };
  return {
    doctor,
    account: { id: crypto.randomUUID(), role: 'medico', doctorId: doctor.id, ...auth },
  };
}

export async function doctorSelfRegistration(data, form) {
  assertUnique(data, form.email);
  if (!form.name?.trim() || form.name.trim().length < 3)
    throw new Error('Informe seu nome completo.');
  if (!form.registration?.trim())
    throw new Error('Informe seu CRM ou registro profissional.');
  if (!/^\d{10,11}$/.test((form.phone || '').replace(/\D/g, '')))
    throw new Error('Informe seu telefone com DDD.');

  let specialty = data.specialties.find((s) => s.id === form.specialtyId);
  let newSpecialty = null;
  if (!specialty && form.specialtyName?.trim()) {
    const existing = data.specialties.find(
      (s) => s.name.toLowerCase() === form.specialtyName.trim().toLowerCase(),
    );
    if (existing) {
      specialty = existing;
    } else {
      newSpecialty = {
        id: `s_${crypto.randomUUID().slice(0, 8)}`,
        name: form.specialtyName.trim(),
        description: 'Atendimento e cuidado especializado.',
        icon: 'stethoscope',
        color: 'sage',
      };
      specialty = newSpecialty;
    }
  }

  if (!specialty) {
    throw new Error('Selecione ou informe sua especialidade médica.');
  }

  if (
    data.doctors.some(
      (d) => d.registration.toLowerCase() === form.registration.trim().toLowerCase(),
    )
  )
    throw new Error('Este registro profissional já está cadastrado.');

  const auth = await credentials(form.email, form.password);
  const doctor = {
    id: crypto.randomUUID(),
    name: form.name.trim().startsWith('Dr') ? form.name.trim() : `Dr(a). ${form.name.trim()}`,
    firstName: form.name.trim().split(' ').slice(0, 2).join(' '),
    specialtyId: specialty.id,
    registration: form.registration.trim().toUpperCase(),
    email: auth.email,
    phone: form.phone,
    city: form.city?.trim() || 'Belo Horizonte, MG',
    clinic: form.clinic?.trim() || data.clinic?.name || 'Consultório Médico Particular',
    address: form.address?.trim() || data.clinic?.address || 'Rua das Flores, 120 · Funcionários, Belo Horizonte - MG',
    lat: typeof form.lat === 'number' ? form.lat : (data.clinic?.lat ?? -19.9227),
    lng: typeof form.lng === 'number' ? form.lng : (data.clinic?.lng ?? -43.9451),
    start: '08:00',
    end: '18:00',
    photo: '',
    rating: '5,0',
    bio: form.bio?.trim() || 'Atendimento humanizado e focado no seu bem-estar.',
  };

  const account = { id: crypto.randomUUID(), role: 'medico', doctorId: doctor.id, ...auth };

  return {
    doctor,
    account,
    newSpecialty,
  };
}

