import { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { PageHeading, StatusBadge, EmptyState, SearchInput, Avatar, ConfirmationModal } from '../../components/common/UI';
import Icon from '../../components/common/Icon';
import { today, formatDate, sortAppointments, normalize, age } from '../../utils/date';

export default function DoctorAppointments() {
  const { data, doctorId, status: updateStatus, notify } = useDemo();
  const doctor = data.doctors.find((d) => d.id === doctorId);

  const [filterTab, setFilterTab] = useState('Todos');
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [cancelModalAppointment, setCancelModalAppointment] = useState(null);

  const doctorAppointments = data.appointments.filter((a) => a.doctorId === doctorId);

  // Counters
  const countToday = doctorAppointments.filter((a) => a.date === today() && a.status !== 'Cancelado').length;
  const countAttended = doctorAppointments.filter((a) => a.status === 'Compareceu').length;
  const countNoShow = doctorAppointments.filter((a) => a.status === 'Não compareceu').length;
  const countCancelled = doctorAppointments.filter((a) => a.status === 'Cancelado').length;

  const filtered = doctorAppointments.filter((a) => {
    const patient = data.patients.find((p) => p.id === a.patientId);
    const matchesSearch = !search || normalize(patient?.name || '').includes(normalize(search));
    const matchesDate = !filterDate || a.date === filterDate;

    if (!matchesSearch || !matchesDate) return false;

    if (filterTab === 'Hoje') {
      return a.date === today() && a.status !== 'Cancelado';
    }
    if (filterTab === 'Próximos') {
      return a.date >= today() && ['Confirmado', 'Pendente'].includes(a.status);
    }
    if (filterTab === 'Compareceu') {
      return a.status === 'Compareceu';
    }
    if (filterTab === 'Não compareceu') {
      return a.status === 'Não compareceu';
    }
    if (filterTab === 'Cancelados') {
      return a.status === 'Cancelado';
    }
    return true;
  });

  const sortedList = sortAppointments(filtered);

  const handleMarkStatus = (appointmentId, newStatus) => {
    try {
      updateStatus(appointmentId, newStatus);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="CONTROLE DE ATENDIMENTOS E PRESENÇA"
        title="Pacientes Agendados"
        description="Acompanhe sua lista de agendamentos, marque quem compareceu, registre faltas ou cancele horários."
      />

      {/* Summary Cards */}
      <div className="metric-grid" style={{ marginBottom: '24px' }}>
        <article className="metric">
          <div className="icon-box sage">
            <Icon name="calendar" />
          </div>
          <span>Agendados Hoje</span>
          <strong>{countToday}</strong>
          <small>Consultas programadas</small>
        </article>

        <article className="metric">
          <div className="icon-box" style={{ background: '#eaf4e6', color: '#4a8247' }}>
            <Icon name="check" />
          </div>
          <span>Compareceu</span>
          <strong>{countAttended}</strong>
          <small>Presenças confirmadas</small>
        </article>

        <article className="metric">
          <div className="icon-box" style={{ background: '#fdf4e7', color: '#b57929' }}>
            <Icon name="clock" />
          </div>
          <span>Não compareceu</span>
          <strong>{countNoShow}</strong>
          <small>Faltas registradas</small>
        </article>

        <article className="metric">
          <div className="icon-box rose">
            <Icon name="x" />
          </div>
          <span>Cancelados</span>
          <strong>{countCancelled}</strong>
          <small>Horários liberados</small>
        </article>
      </div>

      <section className="panel" style={{ padding: '20px' }}>
        {/* Toolbar & Filters */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '18px',
          }}
        >
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['Todos', 'Hoje', 'Próximos', 'Compareceu', 'Não compareceu', 'Cancelados'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`button small ${filterTab === tab ? 'primary' : 'secondary'}`}
                onClick={() => setFilterTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search & Date Input */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #ccd6c7',
                fontSize: '13px',
              }}
              title="Filtrar por data específica"
            />
            {filterDate && (
              <button
                type="button"
                className="button small secondary"
                onClick={() => setFilterDate('')}
              >
                Limpar data
              </button>
            )}
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por paciente..."
            />
          </div>
        </div>

        {/* Appointments List */}
        {sortedList.length === 0 ? (
          <EmptyState
            title="Nenhum agendamento encontrado"
            description="Não encontramos consultas para o filtro selecionado."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedList.map((apt) => {
              const patient = data.patients.find((p) => p.id === apt.patientId);
              const isToday = apt.date === today();

              return (
                <div
                  key={apt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: isToday ? '1px solid #c2dbbe' : '1px solid #e7ece5',
                    background: isToday ? '#f9fcf8' : '#ffffff',
                    flexWrap: 'wrap',
                    gap: '14px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Left: Date, Time & Patient Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '240px' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#edf3e9',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        minWidth: '78px',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#314e44' }}>
                        {apt.time}
                      </span>
                      <small style={{ fontSize: '11px', color: '#63756b' }}>
                        {isToday ? 'Hoje' : apt.date.split('-').reverse().slice(0, 2).join('/')}
                      </small>
                    </div>

                    <Avatar person={patient} />

                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: '#273831' }}>
                        {patient?.name || 'Paciente sem nome'}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#68776f', margin: '2px 0 0' }}>
                        {patient?.birth ? `${age(patient.birth)} anos` : ''} · Tel: {patient?.phone || 'Não informado'}
                      </p>
                      {apt.reason && (
                        <small style={{ color: '#7c8e84', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                          Obs: {apt.reason}
                        </small>
                      )}
                    </div>
                  </div>

                  {/* Center: Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge status={apt.status} />
                  </div>

                  {/* Right: Direct Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Compareceu Button */}
                    <button
                      type="button"
                      onClick={() => handleMarkStatus(apt.id, 'Compareceu')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: apt.status === 'Compareceu' ? '1px solid #488c43' : '1px solid #bee0b9',
                        background: apt.status === 'Compareceu' ? '#488c43' : '#f0f8ee',
                        color: apt.status === 'Compareceu' ? '#ffffff' : '#31692d',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title="Marcar que o paciente compareceu à consulta"
                    >
                      <Icon name="check" size={14} />
                      {apt.status === 'Compareceu' ? 'Compareceu ✓' : 'Compareceu'}
                    </button>

                    {/* Não Compareceu Button */}
                    <button
                      type="button"
                      onClick={() => handleMarkStatus(apt.id, 'Não compareceu')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: apt.status === 'Não compareceu' ? '1px solid #cb8a27' : '1px solid #f6deb6',
                        background: apt.status === 'Não compareceu' ? '#cb8a27' : '#fdf6eb',
                        color: apt.status === 'Não compareceu' ? '#ffffff' : '#8d5910',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title="Marcar falta (paciente não compareceu)"
                    >
                      <Icon name="x" size={14} />
                      {apt.status === 'Não compareceu' ? 'Não compareceu ✓' : 'Não compareceu'}
                    </button>

                    {/* Cancelar Button */}
                    {apt.status !== 'Cancelado' && (
                      <button
                        type="button"
                        className="button small danger-soft"
                        onClick={() => setCancelModalAppointment(apt)}
                        title="Cancelar consulta e liberar o horário"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Confirmation Modal for Canceling */}
      {cancelModalAppointment && (
        <ConfirmationModal
          title="Cancelar agendamento?"
          description={`Deseja realmente cancelar a consulta de ${data.patients.find((p) => p.id === cancelModalAppointment.patientId)?.name} no dia ${formatDate(cancelModalAppointment.date)} às ${cancelModalAppointment.time}? O horário será liberado na agenda.`}
          onClose={() => setCancelModalAppointment(null)}
          onConfirm={() => {
            handleMarkStatus(cancelModalAppointment.id, 'Cancelado');
            setCancelModalAppointment(null);
          }}
        />
      )}
    </>
  );
}
