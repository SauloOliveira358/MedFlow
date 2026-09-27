import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import { PageHeading, SearchInput, EmptyState, Avatar } from '../../components/common/UI';
import { SpecialtyCard, DoctorCard } from '../../components/patient/Cards';
import { DatePicker, TimeSlotPicker } from '../../components/common/DatePicker';
import PatientForm from '../../components/common/PatientForm';
import { patientError, slotUnavailable } from '../../utils/appointments';
import { today, formatDate, normalize } from '../../utils/date';
import Icon from '../../components/common/Icon';
export default function Booking({ area = 'paciente' }) {
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
