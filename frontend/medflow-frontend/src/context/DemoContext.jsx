import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createMockData } from '../data/mockData';
import { demoAccounts } from '../data/demoAccounts';
import { bookAppointment, changeAppointmentStatus, patientError } from '../utils/appointments';
import {
  normalizeEmail,
  passwordHash,
  patientRegistration,
  doctorRegistration,
  requireRole,
} from '../utils/auth';
const Store = createContext(null);
const KEY = 'medflow-react-demo-v2';
const SESSION = 'medflow-session-v1';
function withAccounts(data) {
  if (Array.isArray(data.accounts)) return data;
  const accounts = demoAccounts.filter(
    (a) =>
      a.role === 'clinica' ||
      (a.patientId
        ? data.patients.some((p) => p.id === a.patientId)
        : data.doctors.some((d) => d.id === a.doctorId)),
  );
  return {
    ...data,
    accounts,
    patients: data.patients.map((p) => ({
      ...p,
      email: accounts.find((a) => a.patientId === p.id)?.email || p.email,
    })),
    doctors: data.doctors.map((d) => ({
      ...d,
      email: accounts.find((a) => a.doctorId === d.id)?.email || d.email,
    })),
  };
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (
        d.version === 2 &&
        ['patients', 'doctors', 'specialties', 'appointments', 'records', 'notifications'].every(
          (k) => Array.isArray(d[k]),
        ) &&
        d.clinic
      )
        return withAccounts(d);
    }
  } catch {}
  return withAccounts(createMockData());
}
function loadSession() {
  try {
    return sessionStorage.getItem(SESSION);
  } catch {
    return null;
  }
}
export function DemoProvider({ children, initialData }) {
  const [data, setData] = useState(() => (initialData ? withAccounts(initialData) : load()));
  const dataRef = useRef(data);
  const [sessionId, setSessionId] = useState(loadSession);
  const sessionRef = useRef(sessionId);
  const account = data.accounts.find((a) => a.id === sessionId) || null;
  const doctorId = account?.doctorId;
  const patientId = account?.patientId;
  const [toast, setToast] = useState(null);
  const [storageError, setStorageError] = useState('');
  const notify = (message, type = 'success') =>
    setToast({ message, type, id: crypto.randomUUID() });
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      setStorageError('');
    } catch {
      setStorageError(
        'As alterações serão mantidas apenas nesta sessão. O armazenamento do navegador está indisponível.',
      );
    }
  }, [data]);
  const commit = (next) => {
    dataRef.current = next;
    setData(next);
  };
  const setSession = (id) => {
    sessionRef.current = id;
    setSessionId(id);
    try {
      if (id) sessionStorage.setItem(SESSION, id);
      else sessionStorage.removeItem(SESSION);
    } catch {}
  };
  const actor = () => {
    const user = dataRef.current.accounts.find((a) => a.id === sessionRef.current);
    if (!user) throw new Error('Entre na sua conta para continuar.');
    return user;
  };
  const login = async (email, password) => {
    const user = dataRef.current.accounts.find((a) => a.email === normalizeEmail(email));
    if (!user || (await passwordHash(password, user.salt)) !== user.passwordHash)
      throw new Error('E-mail ou senha incorretos. Confira e tente novamente.');
    setToast(null);
    setSession(user.id);
    return user;
  };
  const logout = () => {
    setSession(null);
    setToast(null);
  };
  const registerPatient = async (form) => {
    if (sessionRef.current) throw new Error('Saia da conta atual para criar outro acesso.');
    const result = await patientRegistration(dataRef.current, form);
    const current = dataRef.current;
    if (current.accounts.some((a) => a.email === result.account.email))
      throw new Error('Este e-mail já possui uma conta.');
    commit({
      ...current,
      patients: [...current.patients, result.patient],
      accounts: [...current.accounts, result.account],
    });
    setSession(result.account.id);
    notify('Sua conta foi criada. Agora você pode agendar sua consulta.');
    return result.account;
  };
  const registerDoctor = async (form) => {
    const result = await doctorRegistration(dataRef.current, actor(), form);
    requireRole(actor(), 'clinica');
    const current = dataRef.current;
    if (
      current.accounts.some((a) => a.email === result.account.email) ||
      current.doctors.some(
        (d) => d.registration.toLowerCase() === result.doctor.registration.toLowerCase(),
      )
    )
      throw new Error('O e-mail ou registro profissional já está cadastrado.');
    commit({
      ...current,
      doctors: [...current.doctors, result.doctor],
      accounts: [...current.accounts, result.account],
    });
    notify('Conta do médico criada. Ele já pode entrar com o e-mail e a senha cadastrados.');
    return result.doctor;
  };
  const checkAppointment = (user, appointment) => {
    if (!appointment) throw new Error('Consulta não encontrada.');
    if (
      (user.role === 'paciente' && appointment.patientId !== user.patientId) ||
      (user.role === 'medico' && appointment.doctorId !== user.doctorId)
    )
      throw new Error('Esta consulta não pertence à sua conta.');
  };
  const book = (input) => {
    const user = actor();
    const current = dataRef.current;
    if (input.id)
      checkAppointment(
        user,
        current.appointments.find((a) => a.id === input.id),
      );
    if (user.role === 'paciente' && (input.patient?.id || input.patientId) !== user.patientId)
      throw new Error('Você só pode agendar para sua própria conta.');
    if (user.role === 'medico' && input.doctorId !== user.doctorId)
      throw new Error('Você só pode gerenciar sua própria agenda.');
    const result = bookAppointment(current, input);
    commit(result.data);
    notify(input.id ? 'Consulta reagendada com sucesso!' : 'Consulta agendada com sucesso!');
    return result.appointment;
  };
  const status = (id, value) => {
    const user = actor();
    checkAppointment(
      user,
      dataRef.current.appointments.find((a) => a.id === id),
    );
    if (user.role === 'paciente' && value !== 'Cancelado')
      throw new Error('Somente a equipe pode alterar o atendimento.');
    commit(changeAppointmentStatus(dataRef.current, id, value));
    notify(
      value === 'Cancelado'
        ? 'Consulta cancelada. O horário foi liberado.'
        : `Consulta atualizada: ${value.toLowerCase()}.`,
    );
  };
  const savePatient = (patient) => {
    const user = actor();
    if (user.role !== 'clinica' && (user.role !== 'paciente' || patient.id !== user.patientId))
      throw new Error('Você não pode editar este paciente.');
    const error = patientError(patient);
    if (error) throw new Error(error);
    const current = dataRef.current;
    const row = { ...patient, id: patient.id || crypto.randomUUID() };
    commit({
      ...current,
      patients: current.patients.some((p) => p.id === row.id)
        ? current.patients.map((p) => (p.id === row.id ? row : p))
        : [...current.patients, row],
    });
    notify('Dados do paciente salvos.');
    return row;
  };
  const saveDoctor = (doctor) => {
    const user = actor();
    if (user.role !== 'medico' || doctor.id !== user.doctorId)
      throw new Error('Você não pode editar este profissional.');
    commit({
      ...dataRef.current,
      doctors: dataRef.current.doctors.map((d) => (d.id === doctor.id ? doctor : d)),
    });
    notify('Perfil atualizado.');
  };
  const saveClinic = (clinic) => {
    requireRole(actor(), 'clinica');
    commit({ ...dataRef.current, clinic });
    notify('Configurações salvas nesta demonstração.');
  };
  const addNote = (recordId, text) => {
    const user = actor();
    requireRole(user, 'medico');
    const current = dataRef.current;
    const record = current.records.find((r) => r.id === recordId);
    if (!record || record.doctorId !== user.doctorId)
      throw new Error('Este prontuário não pertence à sua conta.');
    if (!text.trim()) throw new Error('Escreva uma anotação antes de salvar.');
    commit({
      ...current,
      records: current.records.map((r) =>
        r.id === recordId
          ? {
              ...r,
              updatedAt: new Date().toISOString(),
              notes: [
                ...r.notes,
                {
                  id: crypto.randomUUID(),
                  text: text.trim(),
                  date: new Date().toISOString().slice(0, 10),
                  author: current.doctors.find((d) => d.id === r.doctorId).name,
                },
              ],
            }
          : r,
      ),
    });
    notify('Anotação salva no prontuário fictício.');
  };
  const markRead = () => {
    const user = actor();
    const viewer = user.patientId || user.doctorId;
    commit({
      ...dataRef.current,
      notifications: dataRef.current.notifications.map((n) =>
        (user.role === 'paciente' ? n.patientId === viewer : n.doctorId === viewer)
          ? { ...n, readBy: [...new Set([...n.readBy, viewer])] }
          : n,
      ),
    });
  };
  return (
    <Store.Provider
      value={{
        data,
        account,
        doctorId,
        patientId,
        login,
        logout,
        registerPatient,
        registerDoctor,
        book,
        status,
        savePatient,
        saveDoctor,
        saveClinic,
        addNote,
        markRead,
        notify,
        toast,
        setToast,
        storageError,
      }}
    >
      {children}
    </Store.Provider>
  );
}
export function useDemo() {
  const context = useContext(Store);
  if (!context) throw new Error('DemoProvider ausente');
  return context;
}
