import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import { PageHeading, SearchInput, Avatar, EmptyState, Modal, Field } from './InterfaceUI';
import FormularioPaciente from './FormularioPaciente';
import { age, future, normalize, sortAppointments, formatDate } from '../../utils/date';
import Icone from './Icone';

export default function Pacientes({ area }) {
  const { data, doctorId, savePatient } = useDemo();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const appointments = data.appointments.filter(
    (a) => area !== 'medico' || a.doctorId === doctorId,
  );
  const patients = data.patients.filter(
    (p) =>
      (area !== 'medico' ||
        appointments.some((a) => a.patientId === p.id) ||
        data.records.some((r) => r.patientId === p.id && r.doctorId === doctorId)) &&
      normalize(p.name).includes(normalize(search)) &&
      (!filter || appointments.some((a) => a.patientId === p.id && a.doctorId === filter)),
  );
  const pages = Math.max(1, Math.ceil(patients.length / 6));
  const visible = patients.slice((Math.min(page, pages) - 1) * 6, Math.min(page, pages) * 6);
  const dates = (p) => {
    const own = sortAppointments(appointments.filter((a) => a.patientId === p.id));
    return { last: own.filter((a) => a.status === 'Concluído').at(-1), next: own.find(future) };
  };
  return (
    <>
      <PageHeading
        title="Pacientes"
        description="Cada pessoa, uma história. Encontre as informações para cuidar melhor."
        action={
          area === 'clinica' && (
            <button
              className="button primary"
              onClick={() => {
                setForm({});
                setError('');
              }}
            >
              <Icone name="plus" size={17} />
              Cadastrar paciente
            </button>
          )
        }
      />
      <section className="panel">
        <div className="filters padded">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Buscar paciente"
          />
          {area === 'clinica' && (
            <select
              aria-label="Filtrar pacientes por profissional"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos os profissionais</option>
              {data.doctors.map((d) => (
                <option value={d.id} key={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>{area === 'medico' ? 'Idade' : 'Telefone'}</th>
                <th>Última consulta</th>
                <th>Próxima consulta</th>
                {area === 'clinica' && <th>Profissional</th>}
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const { last, next } = dates(p);
                return (
                  <tr key={p.id}>
                    <td data-label="Paciente">
                      <div className="table-person">
                        <Avatar person={p} />
                        <div>
                          <strong>{p.name}</strong>
                          {area === 'medico' && <small>{p.phone}</small>}
                        </div>
                      </div>
                    </td>
                    <td data-label={area === 'medico' ? 'Idade' : 'Telefone'}>
                      {area === 'medico' ? `${age(p.birth)} anos` : p.phone}
                    </td>
                    <td data-label="Última consulta">{last ? formatDate(last.date) : '—'}</td>
                    <td data-label="Próxima consulta">
                      {next ? `${formatDate(next.date)} · ${next.time}` : 'Sem agendamento'}
                    </td>
                    {area === 'clinica' && (
                      <td data-label="Profissional">
                        {data.doctors.find((d) => d.id === (next || last)?.doctorId)?.name || '—'}
                      </td>
                    )}
                    <td>
                      <button className="text-button" onClick={() => setSelected(p)}>
                        Ver paciente
                        <Icone name="right" size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!patients.length && <EmptyState />}
        <div className="pagination">
          <small>
            {patients.length} paciente(s) · Página {Math.min(page, pages)} de {pages}
          </small>
          <div>
            <button
              className="icon-button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              aria-label="Página anterior"
            >
              <Icone name="left" />
            </button>
            <button
              className="icon-button"
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
              aria-label="Próxima página"
            >
              <Icone name="right" />
            </button>
          </div>
        </div>
      </section>
      {selected && (
        <Modal title="Perfil do paciente" onClose={() => setSelected(null)}>
          <div className="detail-person">
            <Avatar person={selected} large />
            <div>
              <h3>{selected.name}</h3>
              <p>{age(selected.birth)} anos</p>
            </div>
          </div>
          <dl className="detail-grid">
            <div>
              <dt>Telefone</dt>
              <dd>{selected.phone}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{selected.email}</dd>
            </div>
            <div>
              <dt>Nascimento</dt>
              <dd>
                {formatDate(selected.birth, { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </dd>
            </div>
            <div>
              <dt>CPF fictício</dt>
              <dd>{selected.cpf}</dd>
            </div>
          </dl>
          <div className="modal-actions">
            <Link className="button primary" to={`/${area}/prontuarios?paciente=${selected.id}`}>
              Ver prontuários
            </Link>
            {area === 'clinica' && (
              <button
                className="button secondary"
                onClick={() => {
                  setForm(selected);
                  setSelected(null);
                  setError('');
                }}
              >
                Editar cadastro
              </button>
            )}
          </div>
        </Modal>
      )}
      {form && (
        <Modal title="Cadastro do paciente" onClose={() => setForm(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                savePatient(form);
                setForm(null);
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            <FormularioPaciente value={form} onChange={setForm} />
            {error && (
              <p role="alert" className="error-message">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={() => setForm(null)}>
                Voltar
              </button>
              <button className="button primary">Salvar paciente</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
export { Pacientes as Patients };
