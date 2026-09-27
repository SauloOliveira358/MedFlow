import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import { PageHeading, EmptyState, Tabs } from '../../components/common/UI';
import { AppointmentCard, AppointmentDetailsModal } from '../../components/common/Appointment';
import { SpecialtyCard } from '../../components/patient/Cards';
import Icon from '../../components/common/Icon';
import { future, sortAppointments } from '../../utils/date';
import { useNavigate } from 'react-router-dom';
export function PatientDashboard() {
  const { data, patientId } = useDemo();
  const navigate = useNavigate();
  const person = data.patients.find((p) => p.id === patientId);
  const next = sortAppointments(
    data.appointments.filter((a) => a.patientId === patientId && future(a)),
  )[0];
  const [details, setDetails] = useState(null);
  return (
    <>
      <PageHeading
        eyebrow="QUE BOM TER VOCÊ AQUI"
        title={`Olá, ${person.name.split(' ')[0]} 👋`}
        description="Como podemos cuidar de você hoje?"
      />
      <section className="patient-hero">
        <div className="hero-copy">
          <span className="hero-chip">
            <Icon name="heart" size={14} />
            SEU BEM-ESTAR VEM PRIMEIRO
          </span>
          <h2>
            Um tempo para você.
            <br />
            Um cuidado de verdade.
          </h2>
          <p>
            Encontre o profissional certo e dê o próximo
            <br className="desktop-only" /> passo para cuidar de quem mais importa: você.
          </p>
          <Link className="button primary" to="/paciente/agendar">
            Agendar consulta
            <Icon name="arrow" size={18} />
          </Link>
          <small>
            <Icon name="shield" size={14} />
            Simples, acolhedor e no seu tempo.
          </small>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <div className="hero-arch">
            <img src="/portraits/ana.svg" alt="" />
          </div>
          <div className="floating-label care">
            <span className="icon-box rose">
              <Icon name="heart" />
            </span>
            <div>
              Mais perto de você<small>Cuidado em cada detalhe</small>
            </div>
          </div>
          <div className="floating-label rating">
            <span>★</span>Profissionais que acolhem
          </div>
          <span className="petal petal-one" />
          <span className="petal petal-two" />
        </div>
      </section>
      <div className="patient-home-grid">
        <section>
          <div className="section-heading">
            <h2>Seu próximo agendamento</h2>
            <Link className="text-button" to="/paciente/agendamentos">
              Ver todos
              <Icon name="right" size={16} />
            </Link>
          </div>
          {next ? (
            <AppointmentCard appointment={next} onDetails={setDetails} />
          ) : (
            <div className="panel">
              <EmptyState
                title="Seu próximo cuidado começa aqui"
                description="Você ainda não possui consultas futuras agendadas."
                to="/paciente/agendar"
              />
            </div>
          )}
        </section>
        <aside className="wellness-card">
          <span className="icon-box peach">
            <Icon name="flower" size={25} />
          </span>
          <h3>
            Pequenas pausas.
            <br />
            Grandes cuidados.
          </h3>
          <p>Reserve um momento do seu dia para você. Seu bem-estar merece espaço na rotina.</p>
          <Link className="text-button" to="/paciente/perfil">
            Meu espaço de cuidado
            <Icon name="arrow" size={16} />
          </Link>
        </aside>
      </div>
      <section className="specialties-section">
        <div className="section-heading">
          <div>
            <h2>Qual cuidado você procura?</h2>
            <p>Especialidades para cada momento da sua vida.</p>
          </div>
          <Link className="text-button" to="/paciente/agendar">
            Ver especialidades
            <Icon name="right" size={16} />
          </Link>
        </div>
        <div className="specialty-home-grid">
          {data.specialties.slice(0, 4).map((s) => (
            <SpecialtyCard
              key={s.id}
              specialty={s}
              onSelect={(id) => navigate(`/paciente/agendar?especialidade=${id}`)}
            />
          ))}
        </div>
      </section>
      {details && (
        <AppointmentDetailsModal
          appointment={data.appointments.find((a) => a.id === details.id)}
          area="paciente"
          onClose={() => setDetails(null)}
        />
      )}
    </>
  );
}
export function PatientAppointments({ history = false }) {
  const { data, patientId } = useDemo();
  const [tab, setTab] = useState(history ? 'Histórico' : 'Próximos');
  const [details, setDetails] = useState(null);
  const rows = sortAppointments(
    data.appointments.filter(
      (a) => a.patientId === patientId && (tab === 'Próximos' ? future(a) : !future(a)),
    ),
  );
  if (tab === 'Histórico') rows.reverse();
  return (
    <>
      <PageHeading
        title={history ? 'Seu histórico de cuidado' : 'Meus agendamentos'}
        description="Seus encontros de cuidado, organizados em um só lugar."
        action={
          <Link className="button primary" to="/paciente/agendar">
            <Icon name="plus" size={17} />
            Agendar consulta
          </Link>
        }
      />
      <Tabs items={['Próximos', 'Histórico']} value={tab} onChange={setTab} />
      <div className="appointment-grid">
        {rows.map((a) => (
          <AppointmentCard key={a.id} appointment={a} onDetails={setDetails} />
        ))}
      </div>
      {!rows.length && (
        <div className="panel">
          <EmptyState
            title={
              tab === 'Próximos'
                ? 'Você ainda não possui consultas agendadas.'
                : 'Seu histórico começa com o primeiro cuidado.'
            }
            description="Encontre um profissional e escolha o melhor horário para você."
            to="/paciente/agendar"
          />
        </div>
      )}
      {details && (
        <AppointmentDetailsModal
          appointment={data.appointments.find((a) => a.id === details.id)}
          area="paciente"
          onClose={() => setDetails(null)}
        />
      )}
    </>
  );
}
