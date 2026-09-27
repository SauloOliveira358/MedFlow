import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import { PageHeading, SearchInput, Avatar, EmptyState, Tabs, Modal, StatusBadge } from './UI';
import { age, normalize, formatDate, sortAppointments } from '../../utils/date';
import Icon from './Icon';
export function MedicalRecordCard({ record, area }) {
  const { data } = useDemo();
  const patient = data.patients.find((p) => p.id === record.patientId);
  const doctor = data.doctors.find((d) => d.id === record.doctorId);
  const last = sortAppointments(
    data.appointments.filter(
      (a) => a.patientId === patient.id && a.doctorId === doctor.id && a.status === 'Concluído',
    ),
  ).at(-1);
  return (
    <article className="record-card">
      <div className="detail-person">
        <Avatar person={patient} />
        <div>
          <h3>{patient.name}</h3>
          <p>{age(patient.birth)} anos</p>
        </div>
        <Icon name="file" />
      </div>
      <dl>
        <div>
          <dt>Profissional responsável</dt>
          <dd>{doctor.name}</dd>
        </div>
        <div>
          <dt>Última consulta</dt>
          <dd>{last ? formatDate(last.date) : 'Sem consulta concluída'}</dd>
        </div>
        <div>
          <dt>Atualizado em</dt>
          <dd>{new Date(record.updatedAt).toLocaleDateString('pt-BR')}</dd>
        </div>
      </dl>
      <Link className="button secondary full-width" to={`/${area}/prontuarios/${record.id}`}>
        {area === 'medico' ? 'Ver prontuário' : 'Visualizar'}
        <Icon name="arrow" size={16} />
      </Link>
    </article>
  );
}
export function Records({ area }) {
  const { data, doctorId } = useDemo();
  const [params] = useSearchParams();
  const [search, setSearch] = useState('');
  const [patient, setPatient] = useState(params.get('paciente') || '');
  const [professional, setProfessional] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [date, setDate] = useState('');
  const rows = data.records.filter(
    (r) =>
      (area !== 'medico' || r.doctorId === doctorId) &&
      (!patient || r.patientId === patient) &&
      (!professional || r.doctorId === professional) &&
      (!specialty || data.doctors.find((d) => d.id === r.doctorId).specialtyId === specialty) &&
      (!date || r.updatedAt.slice(0, 10) === date) &&
      normalize(data.patients.find((p) => p.id === r.patientId).name).includes(normalize(search)),
  );
  return (
    <>
      <PageHeading
        title="Prontuários"
        description="Histórias de cuidado, organizadas com atenção."
      />
      <div className="filters record-filters">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar prontuário" />
        <select
          aria-label="Filtrar prontuários por paciente"
          value={patient}
          onChange={(e) => setPatient(e.target.value)}
        >
          <option value="">Todos os pacientes</option>
          {data.patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {area === 'clinica' && (
          <>
            <select
              aria-label="Filtrar prontuários por profissional"
              value={professional}
              onChange={(e) => setProfessional(e.target.value)}
            >
              <option value="">Todos os profissionais</option>
              {data.doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar prontuários por especialidade"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              <option value="">Todas as especialidades</option>
              {data.specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <label className="filter-field">
              <span>Última atualização</span>
              <input
                aria-label="Data de atualização"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
          </>
        )}
      </div>
      <div className="records-grid">
        {rows.map((r) => (
          <MedicalRecordCard key={r.id} record={r} area={area} />
        ))}
      </div>
      {!rows.length && (
        <div className="panel">
          <EmptyState
            title="Nenhum prontuário encontrado"
            description="Ajuste os filtros. Novos prontuários são criados ao iniciar um atendimento."
          />
        </div>
      )}
      <p className="privacy-note">
        <Icon name="shield" size={16} />
        Todos os registros desta área são fictícios.
      </p>
    </>
  );
}
export function RecordDetail({ area }) {
  const { data, doctorId, addNote } = useDemo();
  const { id } = useParams();
  const [tab, setTab] = useState('Resumo');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [document, setDocument] = useState(null);
  const record = data.records.find(
    (r) => r.id === id && (area !== 'medico' || r.doctorId === doctorId),
  );
  if (!record)
    return (
      <EmptyState
        title="Prontuário não disponível para este perfil"
        to={`/${area}/prontuarios`}
        action="Voltar aos prontuários"
      />
    );
  const patient = data.patients.find((p) => p.id === record.patientId);
  const doctor = data.doctors.find((d) => d.id === record.doctorId);
  const appointments = sortAppointments(
    data.appointments.filter((a) => a.patientId === patient.id && a.doctorId === doctor.id),
  ).reverse();
  const last = appointments.find((a) => a.status === 'Concluído');
  return (
    <>
      <Link className="text-button back-link" to={`/${area}/prontuarios`}>
        <Icon name="back" size={16} />
        Prontuários
      </Link>
      <section className="panel record-header">
        <Avatar person={patient} large />
        <div>
          <span className="eyebrow">PRONTUÁRIO DEMONSTRATIVO</span>
          <h1>{patient.name}</h1>
          <p>
            {age(patient.birth)} anos · {patient.phone}
          </p>
        </div>
        <div className="record-header-meta">
          <small>Última consulta</small>
          <strong>{last ? formatDate(last.date) : 'Sem consulta concluída'}</strong>
          <small>{doctor.name}</small>
        </div>
      </section>
      <Tabs
        items={['Resumo', 'Consultas', 'Anotações', 'Procedimentos', 'Documentos']}
        value={tab}
        onChange={setTab}
      />
      <section className="panel record-body">
        {tab === 'Resumo' && (
          <>
            <h2>Um olhar sobre o cuidado</h2>
            <p>{record.summary}</p>
            <div className="soft-note">
              <Icon name="shield" />
              <p>Informações fictícias. Este protótipo não contém prontuários reais.</p>
            </div>
            <h3>Últimas anotações</h3>
            {record.notes.slice(-2).map((n) => (
              <article className="timeline-entry" key={n.id}>
                <small>
                  {formatDate(n.date)} · {n.author}
                </small>
                <p>{n.text}</p>
              </article>
            ))}
          </>
        )}
        {tab === 'Consultas' && (
          <>
            <h2>Histórico de consultas</h2>
            {appointments.map((a) => (
              <article className="timeline-entry" key={a.id}>
                <div className="section-heading">
                  <strong>
                    {formatDate(a.date)} · {a.time}
                  </strong>
                  <StatusBadge status={a.status} />
                </div>
                <p>{a.reason || 'Consulta de acompanhamento.'}</p>
              </article>
            ))}
            {!appointments.length && <EmptyState title="Nenhuma consulta registrada" />}
          </>
        )}
        {tab === 'Anotações' && (
          <>
            <h2>Anotações de acompanhamento</h2>
            {record.notes.map((n) => (
              <article className="timeline-entry" key={n.id}>
                <small>
                  {formatDate(n.date)} · {n.author}
                </small>
                <p>{n.text}</p>
              </article>
            ))}
            {area === 'medico' ? (
              <form
                className="note-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  try {
                    addNote(record.id, note);
                    setNote('');
                    setError('');
                  } catch (err) {
                    setError(err.message);
                  }
                }}
              >
                <label className="field">
                  <span>Nova anotação fictícia</span>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    required
                    maxLength={2000}
                    placeholder="Registre uma breve observação sobre o atendimento."
                    rows={4}
                  />
                </label>
                {error && (
                  <p className="error-message" role="alert">
                    {error}
                  </p>
                )}
                <button className="button primary">Salvar anotação</button>
              </form>
            ) : (
              <p className="inline-message">
                As anotações são editadas pelo profissional responsável na área do especialista.
              </p>
            )}
          </>
        )}
        {tab === 'Procedimentos' && (
          <>
            <h2>Procedimentos registrados</h2>
            {record.procedures.map((p, i) => (
              <article className="timeline-entry" key={i}>
                <small>{formatDate(p.date)}</small>
                <h3>{p.name}</h3>
              </article>
            ))}
            {!record.procedures.length && (
              <EmptyState
                title="Nenhum procedimento registrado"
                description="Os procedimentos demonstrativos aparecerão aqui."
              />
            )}
          </>
        )}
        {tab === 'Documentos' && (
          <>
            <h2>Documentos</h2>
            {record.documents.map((d) => (
              <button key={d.id} className="document-item" onClick={() => setDocument(d)}>
                <span className="icon-box sage">
                  <Icon name="file" />
                </span>
                <span>
                  {d.name}
                  <small>Documento fictício · Visualizar</small>
                </span>
                <Icon name="right" />
              </button>
            ))}
            {!record.documents.length && (
              <EmptyState
                title="Nenhum documento anexado"
                description="Esta demonstração não envia arquivos para nenhum servidor."
              />
            )}
          </>
        )}
      </section>
      {document && (
        <Modal title={document.name} onClose={() => setDocument(null)}>
          <p className="document-text">{document.text}</p>
        </Modal>
      )}
    </>
  );
}
