import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import {
  CabecalhoPagina,
  CampoBusca,
  Avatar,
  EstadoVazio,
  Modal,
  CartaoMetrica,
} from '../../components/common/InterfaceUI';
import { normalize, today } from '../../utils/date';
import { formatarNomeMedico } from '../../utils/formatters';
import Icone from '../../components/common/Icone';
import FormularioContaMedico from '../../components/common/FormularioContaMedico';

export function Profissionais() {
  const { data } = useDemo();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const rows = data.doctors.filter(
    (d) => normalize(d.name).includes(normalize(search)) && (!filter || d.specialtyId === filter),
  );
  return (
    <>
      <CabecalhoPagina
        title="Profissionais"
        description="Pessoas que fazem o cuidado acontecer."
        action={
          <button className="button primary" onClick={() => setRegisterOpen(true)}>
            <Icone name="plus" size={17} />
            Cadastrar médico
          </button>
        }
      />
      {registerOpen && <FormularioContaMedico onClose={() => setRegisterOpen(false)} />}
      <div className="filters">
        <CampoBusca value={search} onChange={setSearch} placeholder="Buscar profissional" />
        <select
          aria-label="Especialidade do profissional"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Todas as especialidades</option>
          {data.specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="professionals-grid">
        {rows.map((d) => {
          const day = data.appointments.filter(
            (a) => a.doctorId === d.id && a.date === today() && a.status !== 'Cancelado',
          );
          return (
            <article key={d.id} className="doctor-card">
              <div className="doctor-intro">
                <Avatar person={d} large />
                <span className="availability-pill">
                  {day.some((a) => a.status === 'Em atendimento') ? 'Atendendo' : 'Disponível'}
                </span>
              </div>
              <h3>{formatarNomeMedico(d.name)}</h3>
              <p>{data.specialties.find((s) => s.id === d.specialtyId)?.name || 'Especialidade'}</p>
              <small>{d.registration}</small>
              <div className="next-slot">
                <strong>{day.length} consultas hoje</strong>
                <small>
                  {d.start}–{d.end} · Intervalo 12h–13h
                </small>
              </div>
              <button className="button secondary full-width" onClick={() => setSelected(d)}>
                Ver profissional
                <Icone name="arrow" size={16} />
              </button>
            </article>
          );
        })}
      </div>
      {!rows.length && <EstadoVazio />}
      {selected && (
        <Modal title="Perfil profissional" onClose={() => setSelected(null)}>
          <div className="detail-person">
            <Avatar person={selected} large />
            <div>
              <h3>{formatarNomeMedico(selected.name)}</h3>
              <p>{data.specialties.find((s) => s.id === selected.specialtyId)?.name || 'Especialidade'}</p>
            </div>
          </div>
          <p>{selected.bio}</p>
          <dl className="detail-grid">
            <div>
              <dt>Registro</dt>
              <dd>{selected.registration}</dd>
            </div>
            <div>
              <dt>Telefone</dt>
              <dd>{selected.phone}</dd>
            </div>
            <div>
              <dt>Expediente diário</dt>
              <dd>
                {selected.start}–{selected.end}
              </dd>
            </div>
            <div>
              <dt>Local</dt>
              <dd>{data.clinic.name}</dd>
            </div>
          </dl>
          <Link className="button primary" to="/clinica/agenda">
            Ver agenda geral
          </Link>
        </Modal>
      )}
    </>
  );
}

export function Especialidades() {
  const { data } = useDemo();
  const [search, setSearch] = useState('');
  return (
    <>
      <CabecalhoPagina
        title="Especialidades"
        description="Diferentes olhares, o mesmo compromisso com o cuidado."
      />
      <CampoBusca value={search} onChange={setSearch} placeholder="Buscar especialidade" />
      <div className="specialty-grid clinic-specialties">
        {data.specialties
          .filter((s) => normalize(s.name).includes(normalize(search)))
          .map((s) => (
            <article key={s.id} className="specialty-card">
              <span className={`icon-box ${s.color}`}>
                <Icone name={s.icon} size={26} />
              </span>
              <h3>{s.name}</h3>
              <p>{s.description}</p>
              <small>
                {data.doctors.filter((d) => d.specialtyId === s.id).length} profissional(is)
              </small>
              <Link className="text-button" to="/clinica/profissionais">
                Ver equipe
                <Icone name="arrow" size={16} />
              </Link>
            </article>
          ))}
      </div>
      {!data.specialties.some((s) => normalize(s.name).includes(normalize(search))) && (
        <EstadoVazio />
      )}
    </>
  );
}

export function Relatorios() {
  const { data, notify } = useDemo();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const rows = data.appointments.filter((a) => (!from || a.date >= from) && (!to || a.date <= to));
  const statuses = ['Confirmado', 'Pendente', 'Em atendimento', 'Concluído', 'Cancelado'];
  const invalid = from && to && from > to;
  const download = () => {
    const csv =
      'Status;Quantidade\n' +
      statuses.map((s) => `${s};${rows.filter((a) => a.status === s).length}`).join('\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medflow-relatorio.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Relatório exportado com sucesso.');
  };
  return (
    <>
      <CabecalhoPagina
        title="Relatórios"
        description="Um retrato simples da sua operação."
        action={
          <button className="button secondary" disabled={!!invalid} onClick={download}>
            <Icone name="download" size={17} />
            Exportar resumo
          </button>
        }
      />
      <div className="filters">
        <label className="filter-field">
          <span>De</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="filter-field">
          <span>Até</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>
      {invalid ? (
        <p className="error-message" role="alert">
          A data inicial deve ser anterior à data final.
        </p>
      ) : (
        <>
          <div className="metric-grid">
            <CartaoMetrica label="Consultas no período" value={rows.length} />
            <CartaoMetrica
              label="Pacientes únicos"
              value={new Set(rows.map((a) => a.patientId)).size}
              icon="users"
              tone="rose"
            />
            <CartaoMetrica
              label="Profissionais envolvidos"
              value={new Set(rows.map((a) => a.doctorId)).size}
              icon="stethoscope"
              tone="blue"
            />
          </div>
          <section className="panel report-panel">
            <h2>Atendimentos por status</h2>
            <p>Distribuição dos agendamentos no período selecionado.</p>
            {statuses.map((s) => {
              const n = rows.filter((a) => a.status === s).length;
              return (
                <div className="report-row" key={s}>
                  <span>{s}</span>
                  <div className="bar-track">
                    <div style={{ width: `${rows.length ? (n / rows.length) * 100 : 0}%` }} />
                  </div>
                  <strong>{n}</strong>
                </div>
              );
            })}
            {!rows.length && <EstadoVazio title="Nenhuma consulta no período" />}
          </section>
        </>
      )}
    </>
  );
}

// Aliases para compatibilidade legada
export const Professionals = Profissionais;
export const Specialties = Especialidades;
export const Reports = Relatorios;
