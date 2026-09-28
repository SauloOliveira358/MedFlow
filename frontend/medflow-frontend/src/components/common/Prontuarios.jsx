import { useState, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import { PageHeading, SearchInput, Avatar, EmptyState, Tabs, Modal, StatusBadge } from './InterfaceUI';
import { age, normalize, formatDate, sortAppointments } from '../../utils/date';
import { formatarNomeMedico } from '../../utils/formatters';
import Icone from './Icone';

export function CartaoProntuario({ record, area }) {
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
        <Icone name="file" />
      </div>
      <dl>
        <div>
          <dt>Profissional responsável</dt>
          <dd>{formatarNomeMedico(doctor?.name)}</dd>
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
        <Icone name="arrow" size={16} />
      </Link>
    </article>
  );
}
export const MedicalRecordCard = CartaoProntuario;

export function Prontuarios({ area }) {
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
                  {formatarNomeMedico(d.name)}
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
          <CartaoProntuario key={r.id} record={r} area={area} />
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
        <Icone name="shield" size={16} />
        Todos os registros desta área são fictícios.
      </p>
    </>
  );
}
export const Records = Prontuarios;

export function DetalhesProntuario({ area }) {
  const { data, doctorId, addNote, addDocument, notify } = useDemo();
  const { id } = useParams();
  const fileInputRef = useRef(null);
  const [tab, setTab] = useState('Resumo');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [document, setDocument] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      notify('O arquivo deve ter no máximo 15MB.', 'error');
      return;
    }

    const reader = new FileReader();
    const isImage = file.type.startsWith('image/');
    const isText = file.type.startsWith('text/') || file.name.endsWith('.txt');

    reader.onload = () => {
      try {
        const fileContent = reader.result;
        const newDoc = {
          name: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize:
            file.size / 1024 < 1000
              ? `${(file.size / 1024).toFixed(1)} KB`
              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          fileData: typeof fileContent === 'string' ? fileContent : '',
          text:
            isText && typeof fileContent === 'string'
              ? fileContent
              : `Arquivo anexado: ${file.name}. Tipo: ${file.type || 'Documento digital'}.`,
        };
        addDocument(record.id, newDoc);
      } catch (err) {
        notify(err.message, 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      notify('Erro ao ler o arquivo selecionado.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (isText) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

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
        <Icone name="back" size={16} />
        Prontuários
      </Link>
      <section className="panel record-header">
        <Avatar person={patient} large />
        <div>
          <span className="eyebrow">PRONTUÁRIO</span>
          <h1>{patient.name}</h1>
          <p>
            {age(patient.birth)} anos · {patient.phone}
          </p>
        </div>
        <div className="record-header-meta">
          <small>Última consulta</small>
          <strong>{last ? formatDate(last.date) : 'Sem consulta concluída'}</strong>
          <small>{formatarNomeMedico(doctor?.name)}</small>
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
              <Icone name="shield" />
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
                description="Os procedimentos realizados aparecerão aqui."
              />
            )}
          </>
        )}
        {tab === 'Documentos' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ margin: 0 }}>Documentos do Prontuário</h2>
                <small style={{ color: '#68776f' }}>Exames, laudos, receitas e arquivos anexados</small>
              </div>

              {area !== 'paciente' && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <button
                    type="button"
                    className="button primary"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Icone name="plus" size={16} /> Subir arquivo / documento
                  </button>
                </>
              )}
            </div>

            {area !== 'paciente' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #b8cebe',
                  borderRadius: '12px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: '#f8faf7',
                  cursor: 'pointer',
                  marginBottom: '20px',
                  transition: 'all 0.18s ease',
                }}
              >
                <div style={{ color: '#3f6d63', marginBottom: '8px' }}>
                  <Icone name="file" size={28} />
                </div>
                <strong style={{ display: 'block', color: '#273831', fontSize: '15px', marginBottom: '4px' }}>
                  Clique aqui para selecionar e subir um arquivo
                </strong>
                <small style={{ color: '#68776f', fontSize: '13px' }}>
                  Suporta PDF, Imagens (JPG, PNG), Exames laboratoriais, Laudos e Textos (até 15MB)
                </small>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(record.documents || []).map((d) => (
                <button
                  key={d.id}
                  className="document-item"
                  onClick={() => setDocument(d)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid #dfe5dc',
                    background: '#ffffff',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="icon-box sage">
                      <Icone name="file" />
                    </span>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#26382f', display: 'block' }}>{d.name}</strong>
                      <small style={{ color: '#697a70', fontSize: '12px' }}>
                        {d.fileSize ? `${d.fileSize} · ` : ''}
                        {d.uploadedAt ? `Enviado em ${formatDate(d.uploadedAt.slice(0, 10))} · ` : ''}
                        Clique para visualizar
                      </small>
                    </div>
                  </div>
                  <Icone name="right" />
                </button>
              ))}
            </div>

            {(!record.documents || !record.documents.length) && (
              <EmptyState
                title="Nenhum documento anexado"
                description="Use o botão acima para subir exames, laudos e arquivos do paciente."
              />
            )}
          </>
        )}
      </section>
      {document && (
        <Modal title={document.name} onClose={() => setDocument(null)}>
          <div style={{ padding: '6px 0' }}>
            {document.fileData && document.fileType?.startsWith('image/') ? (
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <img
                  src={document.fileData}
                  alt={document.name}
                  style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '8px', border: '1px solid #d5ded3' }}
                />
              </div>
            ) : null}

            {document.fileData && document.fileType === 'application/pdf' ? (
              <div style={{ textAlign: 'center', padding: '24px 16px', background: '#f8faf7', borderRadius: '10px', marginBottom: '16px', border: '1px solid #e1e8df' }}>
                <Icone name="file" size={42} style={{ color: '#c9302c', marginBottom: '10px' }} />
                <h4 style={{ margin: '0 0 6px', color: '#26382f' }}>Documento PDF Anexado</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#68776f' }}>Clique no botão abaixo para baixar ou visualizar:</p>
                <a
                  href={document.fileData}
                  download={document.name}
                  className="button primary small"
                  style={{ marginTop: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Icone name="download" size={15} /> Baixar {document.name}
                </a>
              </div>
            ) : null}

            <p className="document-text" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, background: '#fbfcfb', padding: '14px', borderRadius: '8px', border: '1px solid #eef2ed' }}>
              {document.text}
            </p>

            {document.fileData && !document.fileType?.startsWith('image/') && document.fileType !== 'application/pdf' && (
              <div style={{ marginTop: '14px' }}>
                <a
                  href={document.fileData}
                  download={document.name}
                  className="button secondary small"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Icone name="download" size={15} /> Baixar arquivo ({document.name})
                </a>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
export const RecordDetail = DetalhesProntuario;
export default Prontuarios;
