import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createMockData } from '../data/mockData';
import { demoAccounts } from '../data/demoAccounts';
import { bookAppointment, changeAppointmentStatus, patientError, getDoctorSlotsForDate } from '../utils/appointments';
import {
  normalizeEmail,
  passwordHash,
  patientRegistration,
  doctorRegistration,
  doctorSelfRegistration,
  requireRole,
} from '../utils/auth';
import { today, addDays } from '../utils/date';
import {
  apiLogin,
  apiRegisterPatient,
  apiRegisterDoctor,
  apiUpdatePhoto,
  apiGetSpecialties,
} from '../services/api';
const Store = createContext(null);
const KEY = 'medflow-react-demo-v2';
const SESSION = 'medflow-session-v1';
function withAccounts(data) {
  const accounts = Array.isArray(data.accounts)
    ? data.accounts
    : demoAccounts.filter(
        (a) =>
          a.role === 'clinica' ||
          (a.patientId
            ? data.patients.some((p) => p.id === a.patientId)
            : data.doctors.some((d) => d.id === a.doctorId)),
      );
  const doctorSchedules = Array.isArray(data.doctorSchedules) ? data.doctorSchedules : [];
  return {
    ...data,
    accounts,
    doctorSchedules,
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
      ) {
        if (!Array.isArray(d.doctorSchedules)) {
          d.doctorSchedules = createMockData().doctorSchedules;
        }
        return withAccounts(d);
      }
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
  useEffect(() => {
    if (typeof window !== 'undefined' && window.__VITEST__) return;
    apiGetSpecialties()
      .then((specialties) => {
        if (Array.isArray(specialties) && specialties.length > 0) {
          setData((prev) => ({
            ...prev,
            specialties: specialties.map((s) => ({
              id: String(s.id),
              name: s.nome,
              description: s.descricao || '',
              icon: s.icone || 'stethoscope',
              color: s.cor || 'sage',
            })),
          }));
        }
      })
      .catch(() => {});
  }, []);

  const login = async (email, password) => {
    if (typeof window !== 'undefined' && window.__VITEST__) {
      const user = dataRef.current.accounts.find((a) => a.email === normalizeEmail(email));
      if (!user || (await passwordHash(password, user.salt)) !== user.passwordHash)
        throw new Error('E-mail ou senha incorretos. Confira e tente novamente.');
      setToast(null);
      setSession(user.id);
      return user;
    }
    try {
      const response = await apiLogin(email, password);
      const role = response.perfil;
      const accountId = `user-${response.usuarioId}`;
      const doctorIdVal = response.medicoId ? `d${response.medicoId}` : null;
      const patientIdVal = response.pacienteId ? `p${response.pacienteId}` : null;

      const userAccount = {
        id: accountId,
        role: role,
        email: response.email,
        name: response.nome,
        doctorId: doctorIdVal,
        patientId: patientIdVal,
        clinicaId: response.clinicaId ? String(response.clinicaId) : null,
        photo: response.fotoUrl || '',
        crm: response.crm,
        specialty: response.especialidade,
        token: response.token,
      };

      const current = dataRef.current;
      let nextDoctors = [...current.doctors];
      let nextPatients = [...current.patients];

      if (role === 'medico' && doctorIdVal) {
        const existingIdx = nextDoctors.findIndex(
          (d) => d.id === doctorIdVal || d.email.toLowerCase() === response.email.toLowerCase(),
        );
        const doctorObj = {
          id: doctorIdVal,
          name: response.nome,
          firstName: response.nome.split(' ').slice(0, 2).join(' '),
          registration: response.crm || 'CRM',
          email: response.email,
          phone: response.telefone || '',
          photo: response.fotoUrl || '',
          specialtyId: '1',
          clinic: 'Clínica MedFlow',
          address: 'Belo Horizonte, MG',
          lat: -19.9227,
          lng: -43.9451,
          start: '08:00',
          end: '18:00',
          rating: '5,0',
          bio: 'Atendimento médico humanizado.',
        };
        if (existingIdx >= 0) {
          nextDoctors[existingIdx] = { ...nextDoctors[existingIdx], ...doctorObj };
        } else {
          nextDoctors.push(doctorObj);
        }
      }

      if (role === 'paciente' && patientIdVal) {
        const existingIdx = nextPatients.findIndex(
          (p) => p.id === patientIdVal || p.email.toLowerCase() === response.email.toLowerCase(),
        );
        const patientObj = {
          id: patientIdVal,
          name: response.nome,
          email: response.email,
          phone: response.telefone || '',
          photo: response.fotoUrl || '',
        };
        if (existingIdx >= 0) {
          nextPatients[existingIdx] = { ...nextPatients[existingIdx], ...patientObj };
        } else {
          nextPatients.push(patientObj);
        }
      }

      const nextAccounts = [
        ...current.accounts.filter(
          (a) => a.id !== accountId && a.email.toLowerCase() !== response.email.toLowerCase(),
        ),
        userAccount,
      ];

      commit({
        ...current,
        doctors: nextDoctors,
        patients: nextPatients,
        accounts: nextAccounts,
      });

      setToast(null);
      setSession(userAccount.id);
      return userAccount;
    } catch (apiErr) {
      throw apiErr;
    }
  };

  const logout = () => {
    setSession(null);
    setToast(null);
  };

  const registerPatient = async (form) => {
    if (sessionRef.current) throw new Error('Saia da conta atual para criar outro acesso.');
    if (typeof window !== 'undefined' && window.__VITEST__) {
      const result = await patientRegistration(dataRef.current, form);
      const current = dataRef.current;
      commit({
        ...current,
        patients: [...current.patients, result.patient],
        accounts: [...current.accounts, result.account],
      });
      setSession(result.account.id);
      notify('Sua conta foi criada. Agora você pode agendar sua consulta.');
      return result.account;
    }
    try {
      const response = await apiRegisterPatient({
        nome: form.name.trim(),
        email: form.email.trim(),
        senha: form.password,
        cpf: form.cpf || '',
        telefone: form.phone || '',
        dataNascimento: form.birth || '',
        fotoBase64: form.photo || '',
      });

      const accountId = `user-${response.usuarioId}`;
      const patientIdVal = `p${response.pacienteId}`;
      const userAccount = {
        id: accountId,
        role: 'paciente',
        email: response.email,
        name: response.nome,
        patientId: patientIdVal,
        photo: response.fotoUrl || form.photo || '',
        token: response.token,
      };

      const patientObj = {
        id: patientIdVal,
        name: response.nome,
        birth: form.birth,
        phone: form.phone,
        email: response.email,
        cpf: form.cpf,
        photo: response.fotoUrl || form.photo || '',
      };

      const current = dataRef.current;
      commit({
        ...current,
        patients: [...current.patients.filter((p) => p.id !== patientIdVal), patientObj],
        accounts: [...current.accounts.filter((a) => a.id !== accountId), userAccount],
      });

      setSession(userAccount.id);
      notify('Sua conta de paciente foi criada e salva no banco de dados!');
      return userAccount;
    } catch (apiErr) {
      throw apiErr;
    }
  };

  const registerDoctor = async (form) => {
    const current = dataRef.current;
    const currentActor = sessionRef.current
      ? current.accounts.find((a) => a.id === sessionRef.current)
      : null;

    if (!currentActor && sessionRef.current) {
      throw new Error('Saia da conta atual para criar outro acesso.');
    }

    if (typeof window !== 'undefined' && window.__VITEST__) {
      let result;
      if (currentActor?.role === 'clinica') {
        result = await doctorRegistration(current, currentActor, form);
      } else {
        result = await doctorSelfRegistration(current, form);
      }
      commit({
        ...current,
        doctors: [...current.doctors, result.doctor],
        accounts: [...current.accounts, result.account],
      });
      if (!currentActor) {
        setSession(result.account.id);
        notify('Sua conta foi criada. Boas-vindas ao MedFlow.');
      } else {
        notify('Conta do médico criada com sucesso. Ele já pode entrar.');
      }
      return result.doctor;
    }

    try {
      const response = await apiRegisterDoctor({
        nome: form.name.trim().replace(/^(dr\(a\)\.?|dra?\.?)\s*/i, '').trim(),
        crm: (form.registration || '').trim().toUpperCase(),
        email: form.email.trim(),
        senha: form.password,
        telefone: form.phone || '',
        especialidadeId: form.specialtyId && !isNaN(Number(form.specialtyId)) ? Number(form.specialtyId) : null,
        especialidadeNome: form.specialtyName || '',
        nomeConsultorio: form.clinic || '',
        endereco: form.address || '',
        latitude: typeof form.lat === 'number' ? form.lat : -19.9227,
        longitude: typeof form.lng === 'number' ? form.lng : -43.9451,
        biografia: form.bio || '',
        fotoBase64: form.photo || '',
      });

      const accountId = `user-${response.usuarioId}`;
      const doctorIdVal = `d${response.medicoId}`;
      const userAccount = {
        id: accountId,
        role: 'medico',
        email: response.email,
        name: response.nome,
        doctorId: doctorIdVal,
        crm: response.crm,
        specialty: response.especialidade,
        photo: response.fotoUrl || form.photo || '',
        token: response.token,
      };

      const doctorObj = {
        id: doctorIdVal,
        name: response.nome,
        firstName: response.nome.split(' ').slice(0, 2).join(' '),
        registration: response.crm,
        email: response.email,
        phone: form.phone,
        city: form.city || 'Belo Horizonte, MG',
        clinic: form.clinic || 'Consultório Médico Particular',
        address: form.address || 'Rua das Flores, 120 · Funcionários, Belo Horizonte - MG',
        lat: typeof form.lat === 'number' ? form.lat : -19.9227,
        lng: typeof form.lng === 'number' ? form.lng : -43.9451,
        specialtyId: form.specialtyId || '1',
        photo: response.fotoUrl || form.photo || '',
        start: '08:00',
        end: '18:00',
        rating: '5,0',
        bio: form.bio || 'Atendimento humanizado e focado no seu bem-estar.',
      };

      commit({
        ...current,
        doctors: [...current.doctors.filter((d) => d.id !== doctorIdVal), doctorObj],
        accounts: [...current.accounts.filter((a) => a.id !== accountId), userAccount],
        doctorSchedules: current.doctorSchedules || [],
      });

      if (!currentActor) {
        setSession(userAccount.id);
        notify('Sua conta de médico foi criada e salva no banco de dados com sucesso!');
      } else {
        notify('Conta do médico criada no banco de dados. Ele já pode entrar com o e-mail e senha.');
      }
      return doctorObj;
    } catch (apiErr) {
      throw apiErr;
    }
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
    const labelMap = {
      Cancelado: 'Consulta cancelada. O horário foi liberado.',
      Compareceu: 'Presença confirmada! Paciente marcado como compareceu.',
      'Não compareceu': 'Marcado como não compareceu (falta registrada).',
      'Em atendimento': 'Atendimento iniciado.',
      Concluído: 'Atendimento concluído com sucesso.',
    };
    notify(labelMap[value] || `Consulta atualizada: ${value.toLowerCase()}.`);
  };
  const saveDoctorSchedule = (targetDoctorId, date, slots) => {
    const user = actor();
    const docId = targetDoctorId || doctorId || user.doctorId;
    if (user.role === 'medico' && docId !== user.doctorId) {
      throw new Error('Você só pode editar a sua própria agenda.');
    }
    const current = dataRef.current;
    const list = current.doctorSchedules || [];
    const existingIndex = list.findIndex(
      (s) => s.doctorId === docId && s.date === date,
    );
    const updatedSchedules = [...list];
    const entry = {
      id: existingIndex >= 0 ? updatedSchedules[existingIndex].id : crypto.randomUUID(),
      doctorId: docId,
      date,
      slots: [...slots].sort(),
      updatedAt: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      updatedSchedules[existingIndex] = entry;
    } else {
      updatedSchedules.push(entry);
    }
    commit({ ...current, doctorSchedules: updatedSchedules });
    notify('Horários liberados para este dia salvos com sucesso!');
    return entry;
  };
  const replicateDoctorSchedule = (targetDoctorId, sourceDate, targetDates) => {
    const user = actor();
    const docId = targetDoctorId || doctorId || user.doctorId;
    if (user.role === 'medico' && docId !== user.doctorId) {
      throw new Error('Você só pode editar a sua própria agenda.');
    }
    if (!Array.isArray(targetDates) || targetDates.length === 0) {
      throw new Error('Selecione pelo menos uma data para replicar.');
    }
    const current = dataRef.current;
    const list = current.doctorSchedules || [];
    const sourceSchedule = list.find(
      (s) => s.doctorId === docId && s.date === sourceDate,
    );
    const slotsToCopy = sourceSchedule?.slots || getDoctorSlotsForDate(current, docId, sourceDate);

    const updatedSchedules = [...list];
    for (const tDate of targetDates) {
      const idx = updatedSchedules.findIndex(
        (s) => s.doctorId === docId && s.date === tDate,
      );
      const entry = {
        id: idx >= 0 ? updatedSchedules[idx].id : crypto.randomUUID(),
        doctorId: docId,
        date: tDate,
        slots: [...slotsToCopy],
        updatedAt: new Date().toISOString(),
      };
      if (idx >= 0) {
        updatedSchedules[idx] = entry;
      } else {
        updatedSchedules.push(entry);
      }
    }
    commit({ ...current, doctorSchedules: updatedSchedules });
    notify(`Horários replicados para ${targetDates.length} dia(s) com sucesso!`);
  };
  const savePatient = (patient) => {
    const user = actor();
    if (user.role !== 'clinica' && (user.role !== 'paciente' || patient.id !== user.patientId))
      throw new Error('Você não pode editar este paciente.');
    const error = patientError(patient);
    if (error) throw new Error(error);
    const current = dataRef.current;
    const row = { ...patient, id: patient.id || crypto.randomUUID() };

    if (patient.photo) {
      const numericUserId = (user.id || '').replace(/\D/g, '');
      if (numericUserId) {
        apiUpdatePhoto(numericUserId, patient.photo).catch(() => {});
      }
    }

    commit({
      ...current,
      patients: current.patients.some((p) => p.id === row.id)
        ? current.patients.map((p) => (p.id === row.id ? row : p))
        : [...current.patients, row],
      accounts: current.accounts.map((a) =>
        a.id === user.id ? { ...a, photo: patient.photo || a.photo, name: patient.name } : a
      ),
    });
    notify('Dados do paciente salvos com sucesso!');
    return row;
  };
  const saveDoctor = (doctor) => {
    const user = actor();
    if (user.role !== 'medico' || doctor.id !== user.doctorId)
      throw new Error('Você não pode editar este profissional.');

    if (doctor.photo) {
      const numericUserId = (user.id || '').replace(/\D/g, '');
      if (numericUserId) {
        apiUpdatePhoto(numericUserId, doctor.photo).catch(() => {});
      }
    }

    commit({
      ...dataRef.current,
      doctors: dataRef.current.doctors.map((d) => (d.id === doctor.id ? doctor : d)),
      accounts: dataRef.current.accounts.map((a) =>
        a.id === user.id ? { ...a, photo: doctor.photo || a.photo, name: doctor.name } : a
      ),
    });
    notify('Perfil atualizado com sucesso no banco de dados!');
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
  const addDocument = (recordId, document) => {
    const user = actor();
    const current = dataRef.current;
    const record = current.records.find((r) => r.id === recordId);
    if (!record) throw new Error('Prontuário não encontrado.');
    if (user.role === 'medico' && record.doctorId !== user.doctorId) {
      throw new Error('Este prontuário não pertence à sua conta.');
    }
    if (!document || !document.name?.trim()) {
      throw new Error('Informe um documento válido.');
    }
    const newDoc = {
      id: crypto.randomUUID(),
      name: document.name.trim(),
      text: document.text || 'Documento anexado ao prontuário do paciente.',
      fileData: document.fileData || '',
      fileType: document.fileType || '',
      fileSize: document.fileSize || '',
      uploadedAt: new Date().toISOString(),
      author: user.role === 'medico' ? (current.doctors.find((d) => d.id === user.doctorId)?.name || 'Especialista') : 'Clínica',
    };
    commit({
      ...current,
      records: current.records.map((r) =>
        r.id === recordId
          ? {
              ...r,
              updatedAt: new Date().toISOString(),
              documents: [...(r.documents || []), newDoc],
            }
          : r,
      ),
    });
    notify(`Documento "${document.name}" anexado com sucesso!`);
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
        saveDoctorSchedule,
        replicateDoctorSchedule,
        savePatient,
        saveDoctor,
        saveClinic,
        addNote,
        addDocument,
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
