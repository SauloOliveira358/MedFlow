import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import { PageHeading, DashboardCard, StatusBadge, EmptyState, Avatar } from './UI';
import { AppointmentDetailsModal } from './Appointment';
import { today, sortAppointments, future } from '../../utils/date';
import Icon from './Icon';
export default function StaffDashboard({ area }) {
  const { data, doctorId } = useDemo();
  const [details, setDetails] = useState(null);
  const isDoctor = area === 'medico';
  const doctor = data.doctors.find((d) => d.id === doctorId);
  const all = data.appointments.filter((a) => !isDoctor || a.doctorId === doctorId);
  const day = sortAppointments(all.filter((a) => a.date === today()));
  const next = sortAppointments(all.filter(future))[0];
  const records = data.records.filter((r) => !isDoctor || r.doctorId === doctorId);
  const metrics = isDoctor
    ? [
        ['Consultas hoje', day.length, 'Seu dia de cuidado', 'calendar', 'sage'],
        [
          'Próximo paciente',
          next
            ? data.patients.find((p) => p.id === next.patientId).name.split(' ')[0]
            : 'Agenda livre',
          next
            ? `${next.time} · ${next.date === today() ? 'Hoje' : next.date.split('-').reverse().join('/')}`
            : 'Sem consultas futuras',
          'user',
          'rose',
        ],
        [
          'Pacientes atendidos',
          new Set(all.filter((a) => a.status === 'Concluído').map((a) => a.patientId)).size,
          'Atendimentos concluídos',
          'users',
          'blue',
        ],
        ['Prontuários recentes', records.length, 'Registros disponíveis', 'file', 'peach'],
      ]
    : [
        ['Consultas hoje', day.length, 'Visão completa do dia', 'calendar', 'sage'],
        [
          'Profissionais atendendo',
          new Set(day.filter((a) => a.status !== 'Cancelado').map((a) => a.doctorId)).size,
          'Equipe com consultas hoje',
          'stethoscope',
          'blue',
        ],
        [
          'Pacientes aguardando',
          day.filter((a) => ['Confirmado', 'Pendente'].includes(a.status)).length,
          'Confirmados e pendentes',
          'users',
          'peach',
        ],
        [
          'Consultas concluídas',
          day.filter((a) => a.status === 'Concluído').length,
          'Cuidado realizado hoje',
          'check',
          'sage',
        ],
        [
          'Cancelamentos',
          day.filter((a) => a.status === 'Cancelado').length,
          'No dia de hoje',
          'x',
          'rose',
        ],
      ];
  return (
    <>
      <PageHeading
        title={isDoctor ? `Olá, ${doctor.firstName}` : 'Um olhar para toda a clínica.'}
        description={
          isDoctor
            ? 'Seu espaço para cuidar com atenção e tranquilidade.'
            : 'Equipe, pacientes e atendimentos. Tudo em sintonia.'
        }
        action={
          <Link className="button primary" to={`/${area}/agendar`}>
            <Icon name="plus" size={18} />
            Nova consulta
          </Link>
        }
      />
      <div className={`metric-grid ${isDoctor ? '' : 'five'}`}>
        {metrics.map(([label, value, detail, icon, tone]) => (
          <DashboardCard key={label} {...{ label, value, detail, icon, tone }} />
        ))}
      </div>
      <div className="staff-dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{isDoctor ? 'Seus atendimentos de hoje' : 'Próximos atendimentos'}</h2>
              <p>Uma rotina organizada para um cuidado mais humano.</p>
            </div>
            <Link className="text-button" to={`/${area}/agenda`}>
              Ver agenda
              <Icon name="arrow" size={16} />
            </Link>
          </div>
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Horário</th>
                  <th>Paciente</th>
                  {!isDoctor && <th>Profissional</th>}
                  <th>Especialidade</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Ação</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {day.map((a) => {
                  const p = data.patients.find((p) => p.id === a.patientId);
                  const d = data.doctors.find((d) => d.id === a.doctorId);
                  return (
                    <tr key={a.id}>
                      <td data-label="Horário">
                        <strong>{a.time}</strong>
                      </td>
                      <td data-label="Paciente">
                        <div className="table-person">
                          <Avatar person={p} />
                          <strong>{p.name}</strong>
                        </div>
                      </td>
                      {!isDoctor && <td data-label="Profissional">{d.name}</td>}
                      <td data-label="Especialidade">
                        {data.specialties.find((s) => s.id === d.specialtyId).name}
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={a.status} />
                      </td>
                      <td>
                        <button
                          className="text-button"
                          onClick={() => setDetails(a)}
                          aria-label={`Ver consulta de ${p.name}`}
                        >
                          Detalhes
                          <Icon name="right" size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!day.length && (
            <EmptyState
              title="Hoje a agenda está livre"
              description="As novas consultas aparecerão aqui."
              to={`/${area}/agendar`}
            />
          )}
        </section>
        <aside>
          <section className="panel quick-links">
            <h2>Para facilitar seu dia</h2>
            {[
              [
                isDoctor ? 'prontuarios' : 'profissionais',
                'file',
                isDoctor ? 'Prontuários recentes' : 'Nossa equipe',
                'Informações a um clique',
              ],
              ['pacientes', 'users', 'Pacientes', 'Pessoas no centro do cuidado'],
              ['agenda', 'calendar', 'Organizar a agenda', 'Cada encontro no seu horário'],
            ].map(([path, icon, title, desc]) => (
              <Link key={path} to={`/${area}/${path}`}>
                <span className="icon-box sage">
                  <Icon name={icon} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </span>
                <Icon name="right" size={17} />
              </Link>
            ))}
          </section>
          <section className="wellness-card">
            <Icon name="flower" size={31} />
            <h3>Presença é cuidado.</h3>
            <p>Uma agenda bem organizada abre espaço para o que realmente importa: as pessoas.</p>
          </section>
        </aside>
      </div>
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
