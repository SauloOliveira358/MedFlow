import { useState, useRef } from 'react';
import { useDemo } from '../../context/DemoContext';
import { Modal } from '../common/UI';
import { AppointmentDetailsModal } from '../common/Appointment';
import Icon from '../common/Icon';
import { today, addDays, formatDate, weekDays, validDate } from '../../utils/date';
import { getDoctorSlotsForDate } from '../../utils/appointments';

const POPULAR_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
  '16:30', '17:00', '17:30', '18:00',
];

const WEEKDAY_NAMES = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

const WEEKDAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function GerenciadorAgendaMedico({ doctorId: propDoctorId }) {
  const { data, doctorId: contextDoctorId, saveDoctorSchedule, replicateDoctorSchedule, notify } = useDemo();
  const currentDoctorId = propDoctorId || contextDoctorId;
  const doctor = data.doctors.find((d) => d.id === currentDoctorId);

  // Week Reference date (starts on Monday)
  const [currentWeekReference, setCurrentWeekReference] = useState(today());
  const currentWeek = weekDays(currentWeekReference);

  // State for Add Hours Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTargetDate, setModalTargetDate] = useState(currentWeek[0]);
  const [singleTimeInput, setSingleTimeInput] = useState('08:00');
  const [intervalStart, setIntervalStart] = useState('08:00');
  const [intervalEnd, setIntervalEnd] = useState('12:00');
  const [intervalStep, setIntervalStep] = useState('30');

  // State for Replicate Modal (Calendar picker with day, month, year)
  const [isReplicateModalOpen, setIsReplicateModalOpen] = useState(false);
  const [sourceReplicateDate, setSourceReplicateDate] = useState(currentWeek[0]);
  const [targetReplicateDate, setTargetReplicateDate] = useState(currentWeek[1]);
  const sourceInputRef = useRef(null);
  const targetInputRef = useRef(null);

  // State for Selected Booked Appointment Modal
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  if (!doctor) {
    return <div className="panel" style={{ padding: '24px' }}>Especialista não encontrado.</div>;
  }

  const navigateWeek = (weeksAmount) => {
    const nextRef = addDays(currentWeekReference, weeksAmount * 7);
    setCurrentWeekReference(nextRef);
  };

  const isBooked = (date, time) =>
    data.appointments.find(
      (a) => a.doctorId === currentDoctorId && a.date === date && a.time === time && a.status !== 'Cancelado',
    );

  const openAddModalForDay = (dateStr) => {
    setModalTargetDate(dateStr);
    setIsAddModalOpen(true);
  };

  const removeSlot = (dateStr, timeToRemove, e) => {
    e?.stopPropagation();
    const booked = isBooked(dateStr, timeToRemove);
    if (booked) {
      notify('Este horário já está agendado por um paciente e não pode ser excluído diretamente.', 'error');
      return;
    }

    const currentSlots = getDoctorSlotsForDate(data, currentDoctorId, dateStr);
    const updated = currentSlots.filter((t) => t !== timeToRemove);
    saveDoctorSchedule(currentDoctorId, dateStr, updated);
  };

  const handleAddSingleSlot = (e) => {
    e?.preventDefault();
    if (!singleTimeInput || !/^\d{2}:\d{2}$/.test(singleTimeInput)) {
      notify('Informe um horário válido (HH:MM).', 'error');
      return;
    }

    const currentSlots = getDoctorSlotsForDate(data, currentDoctorId, modalTargetDate);
    if (currentSlots.includes(singleTimeInput)) {
      notify('Este horário já está liberado nesta data.');
      return;
    }

    const updated = [...currentSlots, singleTimeInput].sort();
    saveDoctorSchedule(currentDoctorId, modalTargetDate, updated);
    notify(`Horário ${singleTimeInput} adicionado com sucesso!`);
  };

  const handleAddInterval = (e) => {
    e?.preventDefault();
    if (!intervalStart || !intervalEnd || intervalStart >= intervalEnd) {
      notify('O horário de início deve ser menor que o horário de término.', 'error');
      return;
    }

    const stepMin = parseInt(intervalStep, 10) || 30;
    const generated = [];

    const [startH, startM] = intervalStart.split(':').map(Number);
    const [endH, endM] = intervalEnd.split(':').map(Number);

    let curMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (curMinutes <= endMinutes) {
      const h = String(Math.floor(curMinutes / 60)).padStart(2, '0');
      const m = String(curMinutes % 60).padStart(2, '0');
      generated.push(`${h}:${m}`);
      curMinutes += stepMin;
    }

    const currentSlots = getDoctorSlotsForDate(data, currentDoctorId, modalTargetDate);
    const updated = Array.from(new Set([...currentSlots, ...generated])).sort();
    saveDoctorSchedule(currentDoctorId, modalTargetDate, updated);
    notify(`${generated.length} horários adicionados com sucesso!`);
  };

  const togglePopularSlot = (time) => {
    const currentSlots = getDoctorSlotsForDate(data, currentDoctorId, modalTargetDate);
    let updated;
    if (currentSlots.includes(time)) {
      const booked = isBooked(modalTargetDate, time);
      if (booked) {
        notify('Este horário possui agendamento confirmado.', 'error');
        return;
      }
      updated = currentSlots.filter((t) => t !== time);
    } else {
      updated = [...currentSlots, time].sort();
    }
    saveDoctorSchedule(currentDoctorId, modalTargetDate, updated);
  };

  const openReplicationModalForDay = (sourceDate) => {
    const validSource = sourceDate || currentWeek[0];
    setSourceReplicateDate(validSource);
    const otherDay = currentWeek.find((d) => d !== validSource) || addDays(validSource, 1);
    setTargetReplicateDate(otherDay);
    setIsReplicateModalOpen(true);
  };

  const handleConfirmReplication = () => {
    if (!validDate(sourceReplicateDate)) {
      notify('Informe uma data de origem válida (dia, mês e ano).', 'error');
      return;
    }
    if (!validDate(targetReplicateDate)) {
      notify('Informe uma data de destino válida (dia, mês e ano).', 'error');
      return;
    }
    if (sourceReplicateDate === targetReplicateDate) {
      notify('A data de destino deve ser diferente da data de origem.', 'error');
      return;
    }
    const currentSourceSlots = getDoctorSlotsForDate(data, currentDoctorId, sourceReplicateDate);
    if (!currentSourceSlots || currentSourceSlots.length === 0) {
      notify('Não há horários configurados na data de origem selecionada.', 'error');
      return;
    }
    replicateDoctorSchedule(currentDoctorId, sourceReplicateDate, [targetReplicateDate]);
    setIsReplicateModalOpen(false);
  };

  const sourceDayIndex = currentWeek.indexOf(sourceReplicateDate);
  const sourceDayName = sourceDayIndex >= 0 ? WEEKDAY_NAMES[sourceDayIndex] : (validDate(sourceReplicateDate) ? formatDate(sourceReplicateDate) : sourceReplicateDate);
  const sourceSlots = validDate(sourceReplicateDate) ? getDoctorSlotsForDate(data, currentDoctorId, sourceReplicateDate) : [];

  const modalDayIndex = currentWeek.indexOf(modalTargetDate);
  const modalDayName = modalDayIndex >= 0 ? WEEKDAY_NAMES[modalDayIndex] : formatDate(modalTargetDate);
  const modalCurrentSlots = getDoctorSlotsForDate(data, currentDoctorId, modalTargetDate);

  return (
    <div className="panel doctor-schedule-manager" style={{ padding: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <span className="eyebrow" style={{ color: '#4a756b' }}>AGENDA SEMANAL DE ATENDIMENTOS</span>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#253830' }}>
            Horários da Semana (Segunda a Domingo)
          </h2>
          <p style={{ color: '#68776f', fontSize: '13px', marginTop: '3px' }}>
            Os horários ficam organizados verticalmente para cada dia da semana. Clique na região do dia para adicionar e configure replicações com 1 clique.
          </p>
        </div>

        <button
          className="button primary"
          type="button"
          onClick={() => openReplicationModalForDay(currentWeek[0])}
          style={{
            background: 'linear-gradient(135deg, #3f6d63, #54867b)',
            boxShadow: '0 4px 12px rgba(63, 109, 99, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Icon name="clipboard" size={17} />
          Replicar horários na semana
        </button>
      </div>

      {/* Week Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f3f7f2',
          border: '1px solid #dfe6dc',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="icon-button"
            onClick={() => navigateWeek(-1)}
            aria-label="Semana anterior"
          >
            <Icon name="left" size={16} />
          </button>

          <span style={{ fontSize: '16px', fontWeight: 700, color: '#273831' }}>
            Semana: {formatDate(currentWeek[0], { day: '2-digit', month: 'short' })} a{' '}
            {formatDate(currentWeek[6], { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>

          <button
            type="button"
            className="icon-button"
            onClick={() => navigateWeek(1)}
            aria-label="Próxima semana"
          >
            <Icon name="right" size={16} />
          </button>

          <button
            type="button"
            className="button small secondary"
            onClick={() => setCurrentWeekReference(today())}
          >
            Semana Atual
          </button>
        </div>

        <div style={{ fontSize: '13px', color: '#56695e' }}>
          Começa na <strong>Segunda-feira</strong> ({formatDate(currentWeek[0])}) e termina no <strong>Domingo</strong> ({formatDate(currentWeek[6])})
        </div>
      </div>

      {/* 7 Vertical Columns Layout (Monday through Sunday) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(135px, 1fr))',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '12px',
          alignItems: 'start',
        }}
      >
        {currentWeek.map((dateStr, idx) => {
          const isTodayDate = dateStr === today();
          const daySlotsFromSchedule = getDoctorSlotsForDate(data, currentDoctorId, dateStr);
          const dayAppointments = data.appointments.filter(
            (a) => a.doctorId === currentDoctorId && a.date === dateStr && a.status !== 'Cancelado',
          );
          const daySlots = Array.from(new Set([...daySlotsFromSchedule, ...dayAppointments.map((a) => a.time)])).sort();

          return (
            <div
              key={dateStr}
              onClick={() => openAddModalForDay(dateStr)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: isTodayDate ? '#f8fbf6' : '#ffffff',
                border: isTodayDate ? '2px solid #54867b' : '1px solid #dfe6dc',
                borderRadius: '12px',
                minHeight: '440px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              title="Clique para adicionar ou gerenciar horários deste dia"
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '12px 10px',
                  background: isTodayDate ? '#54867b' : '#edf4ec',
                  color: isTodayDate ? '#ffffff' : '#273831',
                  borderTopLeftRadius: '10px',
                  borderTopRightRadius: '10px',
                  textAlign: 'center',
                  borderBottom: '1px solid #dfe6dc',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  {WEEKDAY_SHORT[idx]}
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800, margin: '2px 0' }}>
                  {dateStr.slice(-2)}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.9 }}>
                  {isTodayDate ? 'Hoje' : formatDate(dateStr, { month: 'short' }).replace('.', '')}
                </div>
              </div>

              {/* Day Actions & Slot Count */}
              <div
                style={{
                  padding: '8px 6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#fafbfa',
                  borderBottom: '1px solid #edf1ea',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: daySlots.length > 0 ? '#336830' : '#859389',
                    background: daySlots.length > 0 ? '#eaf5e7' : '#f0f2ef',
                    padding: '2px 6px',
                    borderRadius: '6px',
                  }}
                >
                  {daySlots.length} horários
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openReplicationModalForDay(dateStr);
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid #ccd9c9',
                    borderRadius: '6px',
                    padding: '3px 6px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#3f6d63',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                  title="Replicar horários deste dia para os outros"
                >
                  <Icon name="clipboard" size={11} /> Replicar
                </button>
              </div>

              {/* Vertical Stack of Released Hours */}
              <div
                style={{
                  padding: '10px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  flex: 1,
                }}
              >
                {daySlots.length === 0 ? (
                  <div
                    style={{
                      border: '1px dashed #cdd9cb',
                      borderRadius: '8px',
                      padding: '18px 8px',
                      textAlign: 'center',
                      color: '#829187',
                      fontSize: '11px',
                      background: '#fcfffa',
                      margin: 'auto 0',
                    }}
                  >
                    <Icon name="plus" size={16} />
                    <span style={{ display: 'block', marginTop: '4px', fontWeight: 600 }}>
                      + Adicionar hora
                    </span>
                    <small style={{ display: 'block', fontSize: '10px', marginTop: '2px' }}>
                      Clique nesta coluna
                    </small>
                  </div>
                ) : (
                  <>
                    {daySlots.map((time) => {
                      const booked = isBooked(dateStr, time);
                      const patient = booked ? data.patients.find((p) => p.id === booked.patientId) : null;

                      return (
                        <div
                          key={time}
                          onClick={
                            booked
                              ? (e) => {
                                  e.stopPropagation();
                                  setSelectedAppointment(booked);
                                }
                              : undefined
                          }
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '7px 9px',
                            borderRadius: '8px',
                            background: booked ? '#eaf3fa' : '#3f6d63',
                            color: booked ? '#1b4157' : '#ffffff',
                            border: booked ? '1.5px solid #89b3d0' : '1px solid #365e55',
                            fontSize: '12px',
                            boxShadow: booked ? '0 2px 6px rgba(35, 85, 115, 0.12)' : '0 1px 3px rgba(0,0,0,0.08)',
                            cursor: booked ? 'pointer' : 'default',
                            transition: 'all 0.15s ease',
                          }}
                          title={booked ? `Paciente: ${patient?.name || 'Reservado'} (Clique para ver dados)` : undefined}
                        >
                          <span style={{ fontWeight: 700 }}>{time}</span>

                          {booked ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#1a4159',
                                background: '#d4e6f4',
                                padding: '2px 8px',
                                borderRadius: '5px',
                                maxWidth: '85px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {patient?.name ? patient.name.trim().split(' ')[0] : 'Reservado'}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => removeSlot(dateStr, time, e)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 700,
                                lineHeight: 1,
                                padding: '0 2px',
                                opacity: 0.8,
                              }}
                              title="Remover este horário"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddModalForDay(dateStr);
                      }}
                      style={{
                        marginTop: '4px',
                        padding: '6px',
                        borderRadius: '6px',
                        border: '1px dashed #a4c0b4',
                        background: '#f4f8f4',
                        color: '#3f6d63',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <Icon name="plus" size={13} /> + Adicionar mais
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Hours Modal */}
      {isAddModalOpen && (
        <Modal
          title={`Adicionar Horários em ${modalDayName}`}
          onClose={() => setIsAddModalOpen(false)}
        >
          <div style={{ padding: '6px 0' }}>
            {/* Header info for selected day */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#edf4ed',
                border: '1px solid #d3e2d1',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '18px',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#446654', textTransform: 'uppercase' }}>
                  Dia Selecionado
                </span>
                <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#273831', fontSize: '15px' }}>
                  {modalDayName} ({formatDate(modalTargetDate, { day: '2-digit', month: 'long', year: 'numeric' })})
                </p>
              </div>

              {/* Selector to quickly switch day of the week */}
              <select
                value={modalTargetDate}
                onChange={(e) => setModalTargetDate(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #bcc9b9',
                  background: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {currentWeek.map((d, i) => (
                  <option key={d} value={d}>
                    {WEEKDAY_NAMES[i]} ({d.slice(-2)}/{d.split('-')[1]})
                  </option>
                ))}
              </select>
            </div>

            {/* Mode 1: Add a specific time */}
            <div
              style={{
                border: '1px solid #e1e7de',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '14px',
                background: '#ffffff',
              }}
            >
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#273831', margin: '0 0 10px' }}>
                1. Adicionar um horário específico:
              </h4>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="time"
                  value={singleTimeInput}
                  onChange={(e) => setSingleTimeInput(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: '1px solid #ccd6c7',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                />
                <button
                  type="button"
                  className="button primary small"
                  onClick={handleAddSingleSlot}
                >
                  <Icon name="plus" size={14} /> Adicionar Horário
                </button>
              </div>
            </div>

            {/* Mode 2: Add by interval/range */}
            <div
              style={{
                border: '1px solid #e1e7de',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '14px',
                background: '#ffffff',
              }}
            >
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#273831', margin: '0 0 10px' }}>
                2. Adicionar por faixa de horários (Ex: Manhã ou Tarde):
              </h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', color: '#55655d' }}>
                  De:
                  <input
                    type="time"
                    value={intervalStart}
                    onChange={(e) => setIntervalStart(e.target.value)}
                    style={{ marginLeft: '6px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ccd6c7' }}
                  />
                </label>

                <label style={{ fontSize: '12px', color: '#55655d' }}>
                  Até:
                  <input
                    type="time"
                    value={intervalEnd}
                    onChange={(e) => setIntervalEnd(e.target.value)}
                    style={{ marginLeft: '6px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ccd6c7' }}
                  />
                </label>

                <label style={{ fontSize: '12px', color: '#55655d' }}>
                  Intervalo:
                  <select
                    value={intervalStep}
                    onChange={(e) => setIntervalStep(e.target.value)}
                    style={{ marginLeft: '6px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ccd6c7' }}
                  >
                    <option value="15">A cada 15 min</option>
                    <option value="20">A cada 20 min</option>
                    <option value="30">A cada 30 min</option>
                    <option value="45">A cada 45 min</option>
                    <option value="60">A cada 60 min (1h)</option>
                  </select>
                </label>

                <button
                  type="button"
                  className="button secondary small"
                  onClick={handleAddInterval}
                >
                  + Gerar Faixa de Horários
                </button>
              </div>
            </div>

            {/* Mode 3: Quick click popular hours */}
            <div
              style={{
                border: '1px solid #e1e7de',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '16px',
                background: '#ffffff',
              }}
            >
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#273831', margin: '0 0 8px' }}>
                3. Seleção direta de horários:
              </h4>
              <small style={{ display: 'block', color: '#74847b', marginBottom: '10px' }}>
                Clique nos botões abaixo para ativar (verde) ou desativar para este dia:
              </small>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))', gap: '6px' }}>
                {POPULAR_SLOTS.map((time) => {
                  const isSelected = modalCurrentSlots.includes(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => togglePopularSlot(time)}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '6px',
                        border: isSelected ? '1px solid #3f6d63' : '1px solid #d7dfd3',
                        background: isSelected ? '#3f6d63' : '#f8faf7',
                        color: isSelected ? '#ffffff' : '#3c4c44',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {time} {isSelected ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Currently released slots summary in modal */}
            <div style={{ marginBottom: '16px', fontSize: '12px', color: '#52665a' }}>
              <strong>Total de horários salvos neste dia:</strong> {modalCurrentSlots.length} ({modalCurrentSlots.join(', ') || 'Nenhum horário liberado ainda'})
            </div>

            {/* Modal Actions */}
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="button small secondary"
                onClick={() => {
                  setIsAddModalOpen(false);
                  openReplicationModalForDay(modalTargetDate);
                }}
              >
                <Icon name="clipboard" size={14} /> Replicar este dia para outros
              </button>

              <button
                type="button"
                className="button primary"
                onClick={() => setIsAddModalOpen(false)}
              >
                Concluir
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Replicate Modal */}
      {isReplicateModalOpen && (
        <Modal
          title="Replicar Horários de Atendimento"
          onClose={() => setIsReplicateModalOpen(false)}
        >
          <div style={{ padding: '6px 0' }}>
            <p style={{ color: '#52665a', fontSize: '13px', marginBottom: '18px', lineHeight: 1.45 }}>
              Selecione o <strong>dia, mês e ano</strong> da data de origem e de destino usando o calendário ou digitando a data diretamente:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '22px' }}>
              {/* Data de Origem */}
              <div
                style={{
                  background: '#f4f8f4',
                  border: '1.5px solid #c7d9c4',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label
                    htmlFor="replicate-source-date"
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#2d5442',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Icon name="calendar" size={16} /> 1. Data de Origem (De onde copiar os horários):
                  </label>
                  <small style={{ fontSize: '11px', color: '#687b70' }}>Dia / Mês / Ano</small>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    id="replicate-source-date"
                    ref={sourceInputRef}
                    type="date"
                    value={sourceReplicateDate}
                    onChange={(e) => setSourceReplicateDate(e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid #a3beaf',
                      fontSize: '15px',
                      fontWeight: 700,
                      background: '#ffffff',
                      color: '#23382f',
                      cursor: 'pointer',
                    }}
                  />
                  <button
                    type="button"
                    className="button small secondary"
                    onClick={() => sourceInputRef.current?.showPicker?.()}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 12px' }}
                    title="Abrir calendário"
                  >
                    <Icon name="calendar" size={16} /> Calendário
                  </button>
                </div>

                {validDate(sourceReplicateDate) && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#446654' }}>
                    <div style={{ fontWeight: 600 }}>
                      📅 {formatDate(sourceReplicateDate, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ marginTop: '4px', color: sourceSlots.length > 0 ? '#275239' : '#9c4444' }}>
                      {sourceSlots.length > 0 ? (
                        <span>Horários que serão copiados ({sourceSlots.length}): <strong>{sourceSlots.join(', ')}</strong></span>
                      ) : (
                        <span>Nenhum horário liberado nesta data de origem.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Indicador visual de transferência */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#56695e', fontWeight: 600 }}>vai copiar os horários para</span>
                <div
                  style={{
                    background: '#e3ece1',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3f6d63',
                  }}
                >
                  <Icon name="arrow" size={16} />
                </div>
              </div>

              {/* Data de Destino */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #d2e1cf',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label
                    htmlFor="replicate-target-date"
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#2d5442',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Icon name="calendar" size={16} /> 2. Data de Destino (Para onde vão os horários):
                  </label>
                  <small style={{ fontSize: '11px', color: '#687b70' }}>Dia / Mês / Ano</small>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    id="replicate-target-date"
                    ref={targetInputRef}
                    type="date"
                    value={targetReplicateDate}
                    onChange={(e) => setTargetReplicateDate(e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid #a3beaf',
                      fontSize: '15px',
                      fontWeight: 700,
                      background: '#ffffff',
                      color: '#23382f',
                      cursor: 'pointer',
                    }}
                  />
                  <button
                    type="button"
                    className="button small secondary"
                    onClick={() => targetInputRef.current?.showPicker?.()}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 12px' }}
                    title="Abrir calendário"
                  >
                    <Icon name="calendar" size={16} /> Calendário
                  </button>
                </div>

                {validDate(targetReplicateDate) && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#446654' }}>
                    <div style={{ fontWeight: 600 }}>
                      🎯 {formatDate(targetReplicateDate, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    {targetReplicateDate === sourceReplicateDate && (
                      <div style={{ marginTop: '4px', color: '#ad2e2e', fontWeight: 600 }}>
                        ⚠️ A data de destino deve ser diferente da data de origem.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="button secondary"
                onClick={() => setIsReplicateModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="button primary"
                onClick={handleConfirmReplication}
                disabled={!validDate(sourceReplicateDate) || !validDate(targetReplicateDate) || sourceSlots.length === 0}
              >
                <Icon name="clipboard" size={16} /> Replicar Horários
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Booked Appointment Patient Details Modal */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={data.appointments.find((a) => a.id === selectedAppointment.id) || selectedAppointment}
          area="medico"
          onlyCancel={true}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
}
export { GerenciadorAgendaMedico as DoctorScheduleManager };
