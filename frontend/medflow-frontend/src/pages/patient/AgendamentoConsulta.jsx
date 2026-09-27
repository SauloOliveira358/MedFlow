import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import { CabecalhoPagina, CampoBusca, EstadoVazio, Avatar } from '../../components/common/InterfaceUI';
import { CartaoEspecialidade, CartaoMedico } from '../../components/patient/CartoesPaciente';
import { SeletorData, SeletorHorario } from '../../components/common/SeletorData';
import FormularioPaciente from '../../components/common/FormularioPaciente';
import { patientError, slotUnavailable } from '../../utils/appointments';
import { today, formatDate, normalize } from '../../utils/date';
import Icone from '../../components/common/Icone';

const Icon = Icone;
const PageHeading = CabecalhoPagina;
const SearchInput = CampoBusca;
const EmptyState = EstadoVazio;
const SpecialtyCard = CartaoEspecialidade;
const DoctorCard = CartaoMedico;
const DatePicker = SeletorData;
const TimeSlotPicker = SeletorHorario;
const PatientForm = FormularioPaciente;

function DoctorBooking() {
  const { data, doctorId, book } = useDemo();
  const [params] = useSearchParams();
  const editId = params.get('reagendar');
  const original = data.appointments.find((a) => a.id === editId);
  const doctor = data.doctors.find((d) => d.id === doctorId) || data.doctors[0];
  const specialty = data.specialties.find((s) => s.id === doctor?.specialtyId);

  const [patientMode, setPatientMode] = useState('existing');
  const [selectedPatientId, setSelectedPatientId] = useState(original?.patientId || '');
  const [patientSearch, setPatientSearch] = useState('');
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    email: '',
    cpf: '',
    birth: '',
  });
  const [date, setDate] = useState(original?.date >= today() ? original.date : today());
  const [time, setTime] = useState(original?.time || '');
  const [reason, setReason] = useState(original?.reason || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmedPatient, setConfirmedPatient] = useState(null);

  const selectedPatient = data.patients.find((p) => p.id === selectedPatientId);

  const filteredPatients = data.patients.filter((p) => {
    if (!patientSearch) return true;
    const term = normalize(patientSearch);
    return (
      normalize(p.name).includes(term) ||
      (p.cpf && p.cpf.includes(term)) ||
      (p.phone && p.phone.includes(term))
    );
  });

  const handleReset = () => {
    setSelectedPatientId('');
    setPatientSearch('');
    setNewPatient({ name: '', phone: '', email: '', cpf: '', birth: '' });
    setDate(today());
    setTime('');
    setReason('');
    setError('');
    setSuccess(false);
    setConfirmedPatient(null);
  };

  const handleConfirm = () => {
    setError('');
    let finalPatient;
    if (patientMode === 'existing') {
      if (!selectedPatient) {
        setError('Por favor, selecione o paciente que deseja agendar.');
        return;
      }
      finalPatient = selectedPatient;
    } else {
      if (!newPatient.name || newPatient.name.trim().length < 3) {
        setError('Informe o nome completo do paciente.');
        return;
      }
      const rawCpf = (newPatient.cpf || '').replace(/\D/g, '');
      const validCpf = rawCpf.length === 11 ? rawCpf : '12345678901';
      const cleanPhone = newPatient.phone?.trim() || '(31) 98765-4321';
      const cleanEmail =
        newPatient.email?.trim() ||
        `${newPatient.name.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '')}@medflow.demo`;

      finalPatient = {
        name: newPatient.name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        cpf: validCpf,
        birth: newPatient.birth || '1990-01-01',
      };
      const pErr = patientError(finalPatient);
      if (pErr) {
        setError(pErr);
        return;
      }
    }

    if (!time) {
      setError('Por favor, selecione um horário disponível na agenda.');
      return;
    }

    if (slotUnavailable(data, doctor.id, date, time, editId)) {
      setError('Este horário já está ocupado. Por favor, escolha outro horário.');
      return;
    }

    setBusy(true);
    setTimeout(() => {
      try {
        book({
          id: editId || undefined,
          patient: finalPatient,
          doctorId: doctor.id,
          date,
          time,
          reason,
          status: 'Pendente',
        });
        setConfirmedPatient(finalPatient);
        setSuccess(true);
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy(false);
      }
    }, 250);
  };

  if (success && confirmedPatient) {
    return (
      <section className="booking-success">
        <div className="success-orbit">
          <Icon name="check" size={40} />
        </div>
        <span className="eyebrow">CONSULTA CONFIRMADA</span>
        <h1>Consulta agendada com sucesso!</h1>
        <p>A consulta foi registrada na sua agenda com status <b>Pendente</b>.</p>
        <div className="success-summary">
          <Avatar person={doctor} large />
          <h3>{doctor.name}</h3>
          <p>{specialty?.name}</p>
          <div
            style={{
              marginTop: '12px',
              padding: '10px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <div style={{ fontSize: '13px', color: '#64748b' }}>Paciente:</div>
            <strong style={{ fontSize: '16px', color: '#1e293b' }}>{confirmedPatient.name}</strong>
            <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
              Tel: {confirmedPatient.phone} {confirmedPatient.email && `· ${confirmedPatient.email}`}
            </div>
            {reason && (
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Obs: {reason}
              </div>
            )}
          </div>
          <strong style={{ marginTop: '8px', color: '#0f766e', fontSize: '16px' }}>
            {formatDate(date)} às {time}
          </strong>
          <small>{data.clinic?.name || 'Clínica MedFlow'}</small>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link className="button primary" to="/medico/agenda">
            Ver minha agenda
            <Icon name="arrow" size={17} />
          </Link>
          <button type="button" className="button secondary" onClick={handleReset}>
            Agendar outra consulta
          </button>
        </div>
      </section>
    );
  }

  const currentPatientName =
    patientMode === 'existing'
      ? selectedPatient?.name || ''
      : newPatient.name || '';

  return (
    <>
      <PageHeading
        eyebrow="MINHA AGENDA · AGENDAMENTO DIRETO"
        title="Nova consulta"
        description="Agende uma consulta para um paciente selecionando a data e o horário disponíveis."
      />

      <div
        className="panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #e6f7ff 100%)',
          border: '1px solid #bbf7d0',
          padding: '16px 20px',
        }}
      >
        <Avatar person={doctor} large />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#134e4a' }}>{doctor.name}</h3>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: '#0d9488',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              {specialty?.name}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#334155' }}>
            CRM {doctor.crm} · {data.clinic?.name || 'Clínica MedFlow'} · Consulta presencial de 30 minutos
          </p>
        </div>
      </div>

      <div className="booking-layout">
        <section className="booking-main panel">
          {/* SEÇÃO 1: PACIENTE */}
          <div className="booking-step-heading" style={{ marginBottom: '16px' }}>
            <span className="eyebrow">PASSO 1 DE 2</span>
            <h2>Para qual paciente é a consulta?</h2>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '16px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              className={`button small ${patientMode === 'existing' ? 'primary' : 'secondary'}`}
              onClick={() => {
                setPatientMode('existing');
                setError('');
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Icon name="search" size={14} />
              Paciente já cadastrado
            </button>
            <button
              type="button"
              className={`button small ${patientMode === 'new' ? 'primary' : 'secondary'}`}
              onClick={() => {
                setPatientMode('new');
                setSelectedPatientId('');
                setError('');
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Icon name="plus" size={14} />
              Cadastrar novo paciente
            </button>
          </div>

          {patientMode === 'existing' ? (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '12px' }}>
                <SearchInput
                  value={patientSearch}
                  onChange={setPatientSearch}
                  placeholder="Filtrar por nome, CPF ou telefone..."
                />
              </div>
              <label className="field">
                <span>Selecionar paciente</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => {
                    setSelectedPatientId(e.target.value);
                    setError('');
                  }}
                  style={{ fontSize: '15px', padding: '10px 14px' }}
                >
                  <option value="">-- Escolha um paciente --</option>
                  {filteredPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.cpf ? `(CPF: ${p.cpf})` : ''} - {p.phone}
                    </option>
                  ))}
                </select>
              </label>

              {selectedPatient && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px 16px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                      {selectedPatient.name}
                    </strong>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                      Tel: {selectedPatient.phone} · E-mail: {selectedPatient.email} · CPF: {selectedPatient.cpf}
                    </div>
                  </div>
                  <span
                    style={{
                      background: '#ecfdf5',
                      color: '#065f46',
                      border: '1px solid #a7f3d0',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    ✓ Selecionado
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                marginBottom: '24px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#334155' }}>
                Dados do novo paciente
              </h4>
              <div className="form-grid">
                <div className="full">
                  <label className="field">
                    <span>Nome completo *</span>
                    <input
                      type="text"
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                      placeholder="Ex: Carlos Eduardo Silveira"
                      required
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Telefone celular (com DDD) *</span>
                  <input
                    type="tel"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="(31) 98765-4321"
                    required
                  />
                </label>
                <label className="field">
                  <span>E-mail fictício</span>
                  <input
                    type="email"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    placeholder="paciente@exemplo.com"
                  />
                </label>
                <label className="field">
                  <span>CPF fictício</span>
                  <input
                    type="text"
                    value={newPatient.cpf}
                    onChange={(e) => setNewPatient({ ...newPatient, cpf: e.target.value })}
                    placeholder="123.456.789-00"
                  />
                </label>
                <label className="field">
                  <span>Data de nascimento</span>
                  <input
                    type="date"
                    value={newPatient.birth}
                    onChange={(e) => setNewPatient({ ...newPatient, birth: e.target.value })}
                    max={today()}
                  />
                </label>
              </div>
            </div>
          )}

          {/* SEÇÃO 2: DATA E HORÁRIO */}
          <div
            className="booking-step-heading"
            style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}
          >
            <span className="eyebrow">PASSO 2 DE 2</span>
            <h2>Selecione a data e o horário</h2>
          </div>

          <DatePicker
            value={date}
            onChange={(v) => {
              setDate(v);
              setTime('');
              setError('');
            }}
          />

          <div style={{ marginTop: '16px' }}>
            <TimeSlotPicker
              doctorId={doctor.id}
              date={date}
              value={time}
              onChange={(t) => {
                setTime(t);
                setError('');
              }}
              excludeId={editId}
            />
          </div>

          {/* SEÇÃO 3: OBSERVAÇÕES */}
          <div style={{ marginTop: '20px' }}>
            <label className="field full">
              <span>Motivo da consulta / Observações <small>(opcional)</small></span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Paciente ligou relatando sintomas; primeira avaliação presencial..."
                maxLength={500}
                rows={2}
              />
            </label>
          </div>

          {error && (
            <div
              className="error-message"
              role="alert"
              style={{
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Icon name="x" size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="wizard-actions" style={{ marginTop: '24px' }}>
            <Link className="button ghost" to="/medico/agenda">
              <Icon name="back" size={17} />
              Cancelar e voltar
            </Link>
            <button
              type="button"
              className="button primary"
              onClick={handleConfirm}
              disabled={busy}
              style={{ minWidth: '220px' }}
            >
              {busy ? 'Agendando consulta...' : 'Confirmar agendamento'}
              <Icon name="check" size={17} />
            </button>
          </div>
        </section>

        {/* ASIDE / RESUMO */}
        <aside className="booking-aside">
          <div className="panel summary-panel">
            <span className="eyebrow">RESUMO DO AGENDAMENTO</span>
            <h3>Agendamento pela Médica</h3>
            <dl>
              <dt>Profissional</dt>
              <dd>{doctor.name}</dd>
              <dt>Especialidade</dt>
              <dd>{specialty?.name || 'Clínica Geral'}</dd>
              <dt>Paciente</dt>
              <dd style={{ fontWeight: 600, color: currentPatientName ? '#0f766e' : '#94a3b8' }}>
                {currentPatientName || 'Nenhum paciente selecionado'}
              </dd>
              <dt>Data</dt>
              <dd>{formatDate(date, { day: '2-digit', month: 'long', year: 'numeric' })}</dd>
              <dt>Horário</dt>
              <dd style={{ fontWeight: 700, color: time ? '#0f766e' : '#94a3b8' }}>
                {time ? `${time} · 30 minutos` : 'Selecione um horário'}
              </dd>
              <dt>Status inicial</dt>
              <dd>
                <span
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Pendente
                </span>
              </dd>
            </dl>
            <div className="summary-footer">
              <Icon name="shield" />
              <small>
                A consulta entrará diretamente
                <br />
                na sua agenda diária.
              </small>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

export function AgendamentoConsulta({ area = 'paciente' }) {
  if (area === 'medico') {
    return <DoctorBooking />;
  }
  const { data, patientId, doctorId, book } = useDemo();
  const [params] = useSearchParams();
  const editId = params.get('reagendar');
  const original = data.appointments.find((a) => a.id === editId);
  const isPatient = area === 'paciente';
  const permitted =
    !editId ||
    (original &&
      ['Confirmado', 'Pendente'].includes(original.status) &&
      (isPatient
        ? original.patientId === patientId
        : area === 'medico'
          ? original.doctorId === doctorId
          : true));
  const [step, setStep] = useState(isPatient ? 0 : -1);
  const [specialtyId, setSpecialty] = useState(
    original
      ? data.doctors.find((d) => d.id === original.doctorId).specialtyId
      : params.get('especialidade') || '',
  );
  const [selectedDoctor, setDoctor] = useState(
    original?.doctorId || (area === 'medico' ? doctorId : ''),
  );
  const [date, setDate] = useState(original?.date >= today() ? original.date : today());
  const [time, setTime] = useState(original?.time || '');
  const [person, setPerson] = useState(() => ({
    ...data.patients.find((p) => p.id === (original?.patientId || (isPatient ? patientId : ''))),
    reason: original?.reason || '',
  }));
  const [search, setSearch] = useState('');
  const [newPatient, setNewPatient] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const doctor = data.doctors.find((d) => d.id === selectedDoctor);
  const specialty = data.specialties.find((s) => s.id === specialtyId);
  const labels = isPatient
    ? ['Especialidade', 'Profissional', 'Data e horário', 'Seus dados', 'Confirmação']
    : ['Paciente', 'Especialidade', 'Profissional', 'Data e horário', 'Dados', 'Confirmação'];
  const next = () => {
    setError('');
    if (step === -1 && !person.name) {
      setError('Selecione um paciente ou preencha um novo cadastro.');
      return;
    }
    if ((step === 3 || step === -1) && patientError(person)) {
      setError(patientError(person));
      return;
    }
    if (step === 0 && !specialty) {
      setError('Escolha uma especialidade.');
      return;
    }
    if (step === 1 && !doctor) {
      setError('Escolha um profissional.');
      return;
    }
    if (step === 2 && (!time || slotUnavailable(data, selectedDoctor, date, time, editId))) {
      setError('Selecione uma data e um horário disponível.');
      return;
    }
    setStep(step + 1);
    setSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const confirm = () => {
    if (busy) return;
    if (area === 'medico' && selectedDoctor !== doctorId) {
      setError('O perfil foi alterado. Selecione novamente o profissional desta área.');
      setStep(0);
      return;
    }
    setBusy(true);
    setError('');
    setTimeout(() => {
      try {
        book({
          id: editId || undefined,
          patient: person,
          doctorId: selectedDoctor,
          date,
          time,
          reason: person.reason,
        });
        setSuccess(true);
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    }, 350);
  };
  if (!permitted)
    return (
      <EmptyState
        title="Consulta não disponível"
        description="Esta consulta não pertence a esta área ou não pode mais ser reagendada."
        to={`/${area}`}
        action="Voltar ao início"
      />
    );
  if (success)
    return (
      <section className="booking-success">
        <div className="success-orbit">
          <Icon name="check" size={40} />
        </div>
        <span className="eyebrow">TUDO CERTO, {person.name?.split(' ')[0].toUpperCase()}!</span>
        <h1>{editId ? 'Consulta reagendada com sucesso!' : 'Consulta agendada com sucesso!'}</h1>
        <p>Seu cuidado já tem dia e hora marcados.</p>
        <div className="success-summary">
          <Avatar person={doctor} large />
          <h3>{doctor.name}</h3>
          <p>{specialty.name}</p>
          <strong>
            {formatDate(date)} · {time}
          </strong>
          <small>{data.clinic.name}</small>
        </div>
        <Link
          className="button primary"
          to={isPatient ? '/paciente/agendamentos' : `/${area}/agenda`}
        >
          {isPatient ? 'Ver meus agendamentos' : 'Ver agenda'}
          <Icon name="arrow" size={17} />
        </Link>
        <Link className="text-button" to={`/${area}`}>
          Voltar ao início
        </Link>
      </section>
    );
  return (
    <>
      <PageHeading
        title={
          editId
            ? 'Vamos encontrar um novo horário?'
            : isPatient
              ? 'Seu cuidado começa aqui.'
              : 'Nova consulta'
        }
        description={
          isPatient
            ? 'Poucos passos para estar mais perto de quem cuida de você.'
            : 'Organize um novo encontro entre paciente e profissional.'
        }
      />
      <ol className="booking-progress">
        {labels.map((label, i) => {
          const index = isPatient ? i : i - 1;
          return (
            <li
              key={label}
              className={`${index === step ? 'current' : ''} ${index < step ? 'complete' : ''}`}
              aria-current={index === step ? 'step' : undefined}
            >
              <span>{index < step ? <Icon name="check" size={14} /> : i + 1}</span>
              <b>{label}</b>
            </li>
          );
        })}
      </ol>
      <div className="booking-layout">
        <section className="booking-main panel">
          <div className="booking-step-heading">
            <span className="eyebrow">
              PASSO {isPatient ? step + 1 : step + 2} DE {labels.length}
            </span>
            <h2>
              {step === -1
                ? 'Para quem é a consulta?'
                : step === 0
                  ? 'Como podemos cuidar de você?'
                  : step === 1
                    ? 'Encontre seu profissional'
                    : step === 2
                      ? 'Um tempo para cuidar de você'
                      : step === 3
                        ? 'Vamos nos conhecer melhor?'
                        : 'Confira os detalhes da sua consulta'}
            </h2>
          </div>
          {step === -1 && (
            <>
              <label className="field">
                <span>Selecionar paciente</span>
                <select
                  value={person.id || ''}
                  disabled={!!editId}
                  onChange={(e) => {
                    setPerson({ ...data.patients.find((p) => p.id === e.target.value) });
                    setNewPatient(false);
                  }}
                >
                  <option value="">Escolha um paciente</option>
                  {data.patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              {!editId && (
                <button
                  className="text-button spaced"
                  onClick={() => {
                    setNewPatient(true);
                    setPerson({});
                  }}
                >
                  {' '}
                  <Icon name="plus" size={16} />
                  Cadastrar novo paciente
                </button>
              )}
              {newPatient && <PatientForm value={person} onChange={setPerson} />}
            </>
          )}
          {step === 0 && (
            <>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Qual especialista você procura?"
              />
              <div className="specialty-grid">
                {data.specialties
                  .filter((s) => normalize(s.name).includes(normalize(search)))
                  .map((s) => (
                    <div key={s.id} className={s.id === specialtyId ? 'choice selected' : 'choice'}>
                      <SpecialtyCard
                        specialty={s}
                        onSelect={(id) => {
                          setSpecialty(id);
                          setDoctor(
                            area === 'medico' &&
                              data.doctors.find((d) => d.id === doctorId).specialtyId === id
                              ? doctorId
                              : '',
                          );
                          setTime('');
                          setStep(1);
                          setSearch('');
                        }}
                      />
                    </div>
                  ))}
              </div>
              {!data.specialties.some((s) => normalize(s.name).includes(normalize(search))) && (
                <EmptyState />
              )}
            </>
          )}
          {step === 1 && (
            <>
              <div className="chosen-specialty">
                <Icon name={specialty?.icon} />
                <span>{specialty?.name}</span>
                <button className="text-button" onClick={() => setStep(0)}>
                  Alterar
                </button>
              </div>
              <div className="doctor-grid">
                {data.doctors
                  .filter(
                    (d) =>
                      d.specialtyId === specialtyId && (area !== 'medico' || d.id === doctorId),
                  )
                  .map((d) => (
                    <DoctorCard
                      key={d.id}
                      doctor={d}
                      onSelect={(id) => {
                        setDoctor(id);
                        setTime('');
                        setStep(2);
                      }}
                    />
                  ))}
              </div>
              {!data.doctors.some(
                (d) => d.specialtyId === specialtyId && (area !== 'medico' || d.id === doctorId),
              ) && (
                <EmptyState
                  title="Nenhum profissional nesta especialidade"
                  description="Escolha outra especialidade para continuar."
                />
              )}
            </>
          )}
          {step === 2 && (
            <>
              <DatePicker
                value={date}
                onChange={(v) => {
                  setDate(v);
                  setTime('');
                }}
              />
              <TimeSlotPicker
                doctorId={selectedDoctor}
                date={date}
                value={time}
                onChange={setTime}
                excludeId={editId}
              />
            </>
          )}
          {step === 3 && (
            <>
              <p className="form-intro">Só o essencial para preparar o seu atendimento.</p>
              <PatientForm value={person} onChange={setPerson} notes />
              <small className="privacy-note">
                <Icon name="shield" size={15} />
                Ambiente demonstrativo. Utilize apenas informações fictícias.
              </small>
            </>
          )}
          {step === 4 && (
            <>
              <div className="confirmation-person">
                <Avatar person={doctor} large />
                <div>
                  <h3>{doctor?.name}</h3>
                  <p>{specialty?.name}</p>
                </div>
              </div>
              <dl className="detail-grid">
                <div>
                  <dt>Data</dt>
                  <dd>{formatDate(date, { day: '2-digit', month: 'long', year: 'numeric' })}</dd>
                </div>
                <div>
                  <dt>Horário</dt>
                  <dd>{time} · 30 minutos</dd>
                </div>
                <div>
                  <dt>Paciente</dt>
                  <dd>{person.name}</dd>
                </div>
                <div>
                  <dt>Contato</dt>
                  <dd>{person.phone}</dd>
                </div>
                <div className="full">
                  <dt>Clínica</dt>
                  <dd>
                    {data.clinic.name}
                    <small>{data.clinic.address}</small>
                  </dd>
                </div>
                {person.reason && (
                  <div className="full">
                    <dt>Observações</dt>
                    <dd>{person.reason}</dd>
                  </div>
                )}
              </dl>
              <div className="soft-note">
                <Icon name="heart" size={19} />
                <p>
                  Chegue com 10 minutos de antecedência. Estamos preparando tudo para receber você.
                </p>
              </div>
            </>
          )}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <div className="wizard-actions">
            {step > (isPatient ? 0 : -1) ? (
              <button
                className="button ghost"
                onClick={() => {
                  setStep(step - 1);
                  setError('');
                }}
                disabled={busy}
              >
                <Icon name="back" size={17} />
                Voltar
              </button>
            ) : (
              <Link className="button ghost" to={`/${area}`}>
                Voltar ao início
              </Link>
            )}
            {step === 4 ? (
              <button className="button primary" onClick={confirm} disabled={busy}>
                {busy ? 'Confirmando...' : 'Confirmar agendamento'}
                <Icon name="check" size={17} />
              </button>
            ) : (
              <button className="button primary" onClick={next}>
                Continuar
                <Icon name="arrow" size={17} />
              </button>
            )}
          </div>
        </section>
        <aside className="booking-aside">
          <div className="panel summary-panel">
            <span className="eyebrow">SEU AGENDAMENTO</span>
            <h3>Cada detalhe importa.</h3>
            <dl>
              <dt>Especialidade</dt>
              <dd>{specialty?.name || 'Vamos escolher juntos'}</dd>
              <dt>Profissional</dt>
              <dd>{doctor?.name || 'Ainda não selecionado'}</dd>
              <dt>Data e horário</dt>
              <dd>{time ? `${formatDate(date)} · ${time}` : 'Do seu jeito, no seu tempo'}</dd>
            </dl>
            <div className="summary-footer">
              <Icon name="shield" />
              <small>
                Um espaço de cuidado,
                <br />
                feito para você.
              </small>
            </div>
          </div>
          <p className="aside-caption">
            Cuidar de você é o nosso
            <br />
            melhor compromisso.
          </p>
        </aside>
      </div>
    </>
  );
}

export const Booking = AgendamentoConsulta;
export const AgendamentoMedico = DoctorBooking;
export { DoctorBooking };
export default AgendamentoConsulta;
