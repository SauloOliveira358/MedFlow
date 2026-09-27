import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import { PageHeading, Tabs, StatusBadge, EmptyState, SearchInput } from './UI';
import { AppointmentDetailsModal } from './Appointment';
import {
  today,
  addDays,
  weekDays,
  monthDays,
  formatDate,
  sortAppointments,
  normalize,
} from '../../utils/date';
import Icon from './Icon';
export function ScheduleCalendar({ rows, date, view, onDate, onDetails, area }) {
  const { data } = useDemo();
  const dates = view === 'Dia' ? [date] : view === 'Semana' ? weekDays(date) : monthDays(date);
  const inView = rows.filter((a) => dates.includes(a.date));
  if (view === 'Mês')
    return (
      <>
        <div className="month-weekdays">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="month-calendar">
          {dates.map((day) => (
            <div
              key={day}
              className={`month-day ${day.slice(0, 7) !== date.slice(0, 7) ? 'outside' : ''} ${day === today() ? 'today' : ''}`}
            >
              <button
                className="day-number"
                aria-label={`Ver dia ${formatDate(day)}`}
                onClick={() => onDate(day)}
              >
                {day.slice(-2)}
              </button>
              {inView
                .filter((a) => a.date === day)
                .map((a) => (
                  <button
                    className={`month-event status-${a.status === 'Cancelado' ? 'cancelled' : a.status === 'Pendente' ? 'pending' : a.status === 'Compareceu' ? 'attended' : a.status === 'Não compareceu' ? 'no-show' : 'confirmed'}`}
                    key={a.id}
                    onClick={() => onDetails(a)}
                    title={`${a.time} ${data.patients.find((p) => p.id === a.patientId).name}`}
                  >
                    <b>{a.time}</b>
                    <span>
                      {data.patients.find((p) => p.id === a.patientId).name.split(' ')[0]}
                    </span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      </>
    );
  return (
    <div className={view === 'Semana' ? 'week-calendar' : 'day-calendar'}>
      {dates.map((day) => (
        <section key={day} className="schedule-day">
          {view === 'Semana' && <h3>{formatDate(day, { weekday: 'short', day: '2-digit' })}</h3>}
          {sortAppointments(inView.filter((a) => a.date === day)).map((a) => {
            const doctor = data.doctors.find((d) => d.id === a.doctorId);
            return (
              <button className="schedule-event" key={a.id} onClick={() => onDetails(a)}>
                <time>
                  {a.time}
                  <small>30 min</small>
                </time>
                <div>
                  <strong>{data.patients.find((p) => p.id === a.patientId).name}</strong>
                  <p>{data.specialties.find((s) => s.id === doctor.specialtyId).name}</p>
                  {area === 'clinica' && <small>{doctor.name}</small>}
                </div>
                <StatusBadge status={a.status} />
                <Icon name="right" size={16} />
              </button>
            );
          })}
          {!inView.some((a) => a.date === day) && <div className="day-empty">Agenda livre</div>}
        </section>
      ))}
    </div>
  );
}
export default function Schedule({
  area = 'medico',
  appointmentsPage = false,
  attendances = false,
}) {
  const { data, doctorId } = useDemo();
  const [date, setDate] = useState(today());
  const [view, setView] = useState('Dia');
  const [professional, setProfessional] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [details, setDetails] = useState(null);
  const rows = data.appointments.filter(
    (a) =>
      (area !== 'medico' || a.doctorId === doctorId) &&
      (!professional || a.doctorId === professional) &&
      (!specialty || data.doctors.find((d) => d.id === a.doctorId).specialtyId === specialty) &&
      (!status || a.status === status) &&
      (!attendances || ['Em atendimento', 'Concluído'].includes(a.status)) &&
      normalize(data.patients.find((p) => p.id === a.patientId).name).includes(normalize(search)),
  );
  const changePeriod = (amount) => {
    if (view === 'Mês') {
      const d = new Date(date + 'T12:00:00');
      d.setDate(1);
      d.setMonth(d.getMonth() + amount);
      setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
    } else setDate(addDays(date, amount * (view === 'Semana' ? 7 : 1)));
  };
  return (
    <>
      <PageHeading
        title={
          attendances
            ? 'Atendimentos'
            : appointmentsPage
              ? 'Agendamentos'
              : area === 'medico'
                ? 'Minha agenda'
                : 'Agenda geral'
        }
        description={
          area === 'medico'
            ? 'Seu dia organizado. Mais presença em cada atendimento.'
            : 'Todos os profissionais, conectados em uma única agenda.'
        }
        action={
          <Link className="button primary" to={`/${area}/agendar`}>
            <Icon name="plus" size={17} />
            Nova consulta
          </Link>
        }
      />

      <section className="panel agenda-panel">
        <div className="calendar-toolbar">
          <div className="calendar-nav">
            <button
              className="icon-button"
              aria-label="Período anterior"
              onClick={() => changePeriod(-1)}
            >
              <Icon name="left" />
            </button>
            <h2>
              {formatDate(
                date,
                view === 'Mês'
                  ? { month: 'long', year: 'numeric' }
                  : { day: '2-digit', month: 'long', year: 'numeric' },
              )}
            </h2>
            <button
              className="icon-button"
              aria-label="Próximo período"
              onClick={() => changePeriod(1)}
            >
              <Icon name="right" />
            </button>
            <button className="button small secondary" onClick={() => setDate(today())}>
              Hoje
            </button>
          </div>
          <Tabs items={['Dia', 'Semana', 'Mês']} value={view} onChange={setView} />
        </div>
        <div className="filters">
          <label className="filter-field">
            <span>Data</span>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                if (e.target.value) setDate(e.target.value);
              }}
            />
          </label>
          {area === 'clinica' && (
            <>
              <label className="filter-field">
                <span>Profissional</span>
                <select value={professional} onChange={(e) => setProfessional(e.target.value)}>
                  <option value="">Todos os profissionais</option>
                  {data.doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="filter-field">
                <span>Especialidade</span>
                <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                  <option value="">Todas as especialidades</option>
                  {data.specialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className="filter-field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos os status</option>
              {(area === 'medico'
                ? ['Pendente', 'Compareceu', 'Não compareceu', 'Cancelado']
                : ['Confirmado', 'Pendente', 'Em atendimento', 'Concluído', 'Cancelado']
              ).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar paciente" />
        </div>
        <ScheduleCalendar
          rows={rows}
          date={date}
          view={view}
          onDate={(v) => {
            setDate(v);
            setView('Dia');
          }}
          onDetails={setDetails}
          area={area}
        />
        <div className="panel-foot">
          <Icon name="clock" size={14} />
          Horários locais · Atendimento presencial · 30 minutos por consulta
        </div>
      </section>
      {details && (
        <AppointmentDetailsModal
          appointment={data.appointments.find((a) => a.id === details.id)}
          area={area}
          onClose={() => setDetails(null)}
        />
      )}
    </>
  );
}
