import { useRemoteAgenda } from '../../hooks/useRemoteAgenda';
import { useState, useRef } from 'react';
import { useDemo } from '../../context/DemoContext';
import { Modal } from '../common/InterfaceUI';
import { ModalDetalhesConsulta as AppointmentDetailsModal } from '../common/Consulta';
import Icone from '../common/Icone';

const Icon = Icone;
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

const getNowTimeStr = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const getSuggestedTime = (targetDate) => {
  if (targetDate === today()) {
    const now = new Date();
    let hour = now.getHours();
    let min = now.getMinutes() < 30 ? 30 : 0;
    if (min === 0) hour = Math.min(23, hour + 1);
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
  return '08:00';
};

export default function GerenciadorAgendaMedico({ doctorId: propDoctorId }) {
  const { data, doctorId: contextDoctorId, saveDoctorSchedule, replicateDoctorSchedule, notify } = useDemo();
  const currentDoctorId = propDoctorId || contextDoctorId;
  const doctor = data.doctors.find((d) => d.id === currentDoctorId);

  // Week Reference date (starts on Monday)
  const [currentWeekReference, setCurrentWeekReference] = useState(today());
  const currentWeek = weekDays(currentWeekReference);
  const { loading, error } = useRemoteAgenda(currentDoctorId, currentWeek);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  // State for Add Hours Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTargetDate, setModalTargetDate] = useState(() => currentWeek.find((d) => d >= today()) || today());
  const [singleTimeInput, setSingleTimeInput] = useState('08:00');
  const [intervalStart, setIntervalStart] = useState('08:00');
  const [intervalEnd, setIntervalEnd] = useState('18:00');
  const [intervalStep, setIntervalStep] = useState('30');

  // State for Replicate Modal (Calendar picker with day, month, year)
  const [isReplicateModalOpen, setIsReplicateModalOpen] = useState(false);
  const [sourceReplicateDate, setSourceReplicateDate] = useState(currentWeek[0]);
  const [targetReplicateDate, setTargetReplicateDate] = useState(() => currentWeek.find((d) => d > today()) || addDays(today(), 1));
  const sourceInputRef = useRef(null);
  const targetInputRef = useRef(null);

  // State for Selected Booked Appointment Modal
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const persist = async (date, slots) => {
    if (savingRef.current) return false;
    if (date < today()) {
      notify('Não é possível salvar horários para datas passadas.', 'error');
      return false;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      await saveDoctorSchedule(currentDoctorId, date, slots);
      return true;
    } catch (e) {
      notify(e.message, 'error');
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

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
    if (dateStr < today()) {
      notify('Não é possível adicionar horários em datas passadas.', 'error');
      return;
    }
    setModalTargetDate(dateStr);
    const suggested = getSuggestedTime(dateStr);
    setSingleTimeInput(suggested);
    setIntervalStart(suggested);
    setIntervalEnd('18:00');
    setIsAddModalOpen(true);
  };

  const handleModalDateChange = (newDate) => {
    if (newDate < today()) {
      notify('Datas passadas não podem ser selecionadas para novos horários.', 'error');
      return;
    }
    setModalTargetDate(newDate);
    const suggested = getSuggestedTime(newDate);
    setSingleTimeInput(suggested);
    setIntervalStart(suggested);
  };

  const removeSlot = async (dateStr, timeToRemove, e) => {
    e?.stopPropagation();
    if (dateStr < today()) {
      notify('Não é possível remover horários de datas passadas.', 'error');
      return;
    }
    const booked = isBooked(dateStr, timeToRemove);
    if (booked) {
      notify('Este horário já está agendado por um paciente e não pode ser excluído diretamente.', 'error');
      return;
    }

    if (!window.confirm(`Deseja remover o horário ${timeToRemove} deste dia?`)) {
      return;
    }

    const currentSlots = getDoctorSlotsForDate(data, currentDoctorId, dateStr);
    const updated = currentSlots.filter((t) => t !== timeToRemove);
    await persist(dateStr, updated);
  };

  const handleAddSingleSlot = async (e) => {
    e?.preventDefault();
    if (!singleTimeInput || !/^\d{2}:\d{2}$/.test(singleTimeInput)) {
      notify('Informe um horário válido (HH:MM).', 'error');
      return;
    }
    if (modalTargetDate < today()) {
      notify('Não é possível adicionar horários em datas passadas.', 'error');
      return;
    }
    const nowTime = getNowTimeStr();
    if (modalTargetDate === today() && singleTimeInput <= nowTime) {
      notify('Para o dia de hoje, informe um horário futuro.', 'error');
      return;
    }

    const currentSlots = getDoctorSlotsForDate(data, currentDoctorId, modalTargetDate);
    if (currentSlots.includes(singleTimeInput)) {
      notify('Este horário já está liberado nesta data.');
      return;
    }

    const updated = [...currentSlots, singleTimeInput].sort();
    if (!(await persist(modalTargetDate, updated))) return;
    notify(`Horário ${singleTimeInput} adicionado com sucesso!`);
  };

  const handleAddInterval = async (e) => {
    e?.preventDefault();
    if (!intervalStart || !intervalEnd || intervalStart >= intervalEnd) {
      notify('O horário de início deve ser menor que o horário de término.', 'error');
      return;
    }
    if (modalTargetDate < today()) {
      notify('Não é possível adicionar horários em datas passadas.', 'error');
      return;
    }
    const nowTime = getNowTimeStr();
    if (modalTargetDate === today() && intervalEnd <= nowTime) {
      notify('O término da faixa deve ser posterior ao horário atual.', 'error');
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
      const timeStr = `${h}:${m}`;
      if (modalTargetDate !== today() || timeStr > nowTime) {
        generated.push(timeStr);
      }
      curMinutes += stepMin;
    }

    if (generated.length === 0) {
      notify('Nenhum horário futuro pôde ser gerado para esta faixa no dia de hoje.', 'error');
      return;
    }

    const currentSlots = getDoctorSlotsForDate(data, currentDoctorId, modalTargetDate);
    const updated = Array.from(new Set([...currentSlots, ...generated])).sort();
    if (!(await persist(modalTargetDate, updated))) return;
    notify(`${generated.length} horário(s) adicionado(s) com sucesso!`);
  };

  const togglePopularSlot = async (time) => {
    if (modalTargetDate < today()) {
      notify('Não é possível alterar horários em datas passadas.', 'error');
      return;
    }
    const nowTime = getNowTimeStr();
    if (modalTargetDate === today() && time <= nowTime) {
      notify('Não é possível adicionar horários anteriores ao horário atual hoje.', 'error');
      return;
    }
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
    if (!(await persist(modalTargetDate, updated))) return;
  };

  const openReplicationModalForDay = (sourceDate) => {
    const validSource = sourceDate || currentWeek.find((d) => d >= today()) || today();
    setSourceReplicateDate(validSource);
    const futureDays = currentWeek.filter((d) => d >= today() && d !== validSource);
    const defaultTarget = futureDays.length > 0 ? futureDays[0] : (validSource === today() ? addDays(today(), 1) : today());
    setTargetReplicateDate(defaultTarget);
    setIsReplicateModalOpen(true);
  };

  const handleConfirmReplication = async () => {
    if (!validDate(sourceReplicateDate)) {
      notify('Informe uma data de origem válida (dia, mês e ano).', 'error');
      return;
    }
    if (!validDate(targetReplicateDate)) {
      notify('Informe uma data de destino válida (dia, mês e ano).', 'error');
      return;
    }
    if (targetReplicateDate < today()) {
      notify('A data de destino não pode ser uma data passada. Replicar só é permitido para datas futuras.', 'error');
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
    if (targetReplicateDate === today()) {
      const nowTime = getNowTimeStr();
      const validSlots = currentSourceSlots.filter((t) => t >= nowTime);
      if (validSlots.length === 0) {
        notify('Não há horários futuros válidos na data de origem para replicar para o dia de hoje.', 'error');
        return;
      }
    }
    setSaving(true);
    try {
      await replicateDoctorSchedule(currentDoctorId, sourceReplicateDate, [targetReplicateDate]);
      setIsReplicateModalOpen(false);
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const sourceDayIndex = currentWeek.indexOf(sourceReplicateDate);
  const sourceDayName = sourceDayIndex >= 0 ? WEEKDAY_NAMES[sourceDayIndex] : (validDate(sourceReplicateDate) ? formatDate(sourceReplicateDate) : sourceReplicateDate);
  const sourceSlots = validDate(sourceReplicateDate) ? getDoctorSlotsForDate(data, currentDoctorId, sourceReplicateDate) : [];

  const modalDayIndex = currentWeek.indexOf(modalTargetDate);
  const modalDayName = modalDayIndex >= 0 ? WEEKDAY_NAMES[modalDayIndex] : formatDate(modalTargetDate);
  const modalCurrentSlots = getDoctorSlotsForDate(data, currentDoctorId, modalTargetDate);

  const availablePopularSlots = modalTargetDate === today()
    ? POPULAR_SLOTS.filter((t) => t > getNowTimeStr())
    : POPULAR_SLOTS;

  const isTargetDatePast = validDate(targetReplicateDate) && targetReplicateDate < today();

  return (
    <div className="panel doctor-schedule-manager" style={{ padding: '24px' }}>
      {error && <p role="alert" style={{ color: '#b91c1c', marginBottom: '12px' }}>Não foi possível carregar a agenda: {error}</p>}
      <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="eyebrow" style={{ color: '#4a756b' }}>AGENDA SEMANAL DE ATENDIMENTOS</span>
            {loading && (
              <span style={{ fontSize: '11px', color: '#3f6d63', background: '#eaf4ee', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                Sincronizando...
              </span>
            )}
          </div>
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
          onClick={() => openReplicationModalForDay(currentWeek.find((d) => d >= today()) || today())}
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
          background: 'var(--surface-subtle, #f3f7f2)',
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
          const isPastDate = dateStr < today();
          const isTodayDate = dateStr === today();
          const nowTime = getNowTimeStr();

          const daySlotsFromSchedule = getDoctorSlotsForDate(data, currentDoctorId, dateStr);
          const dayAppointments = data.appointments.filter(
            (a) => a.doctorId === currentDoctorId && a.date === dateStr && a.status !== 'Cancelado',
          );
          const rawDaySlots = Array.from(new Set([...daySlotsFromSchedule, ...dayAppointments.map((a) => a.time)])).sort();

          // No dia de hoje, não exibir horários anteriores ao horário atual
          const daySlots = isTodayDate
            ? rawDaySlots.filter((time) => time >= nowTime)
            : rawDaySlots;

          return (
            <div
              key={dateStr}
              onClick={isPastDate ? undefined : () => openAddModalForDay(dateStr)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: isPastDate ? 'var(--surface-past, #f6f7f6)' : isTodayDate ? 'var(--surface-today, #f8fbf6)' : 'var(--surface-card, #ffffff)',
                border: isTodayDate ? '2px solid var(--primary, #54867b)' : isPastDate ? '1px solid var(--border-subtle, #e2e8e0)' : '1px solid var(--border-card, #dfe6dc)',
                borderRadius: '12px',
                minHeight: '440px',
                boxShadow: isPastDate ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
                cursor: isPastDate ? 'not-allowed' : 'pointer',
                opacity: isPastDate ? 0.72 : 1,
                transition: 'all 0.18s ease',
              }}
              title={isPastDate ? 'Data passada (não é permitido adicionar nem alterar)' : 'Clique para adicionar ou gerenciar horários deste dia'}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '12px 10px',
                  background: isPastDate ? 'var(--surface-past-header, #e3eae1)' : isTodayDate ? '#54867b' : 'var(--surface-header, #edf4ec)',
                  color: isPastDate ? 'var(--muted, #6c7d73)' : isTodayDate ? '#ffffff' : 'var(--ink, #273831)',
                  borderTopLeftRadius: '10px',
                  borderTopRightRadius: '10px',
                  textAlign: 'center',
                  borderBottom: '1px solid var(--border-card, #dfe6dc)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  {WEEKDAY_SHORT[idx]}
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800, margin: '2px 0' }}>
                  {dateStr.slice(-2)}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.9 }}>
                  {isTodayDate ? 'Hoje' : isPastDate ? 'Passado' : formatDate(dateStr, { month: 'short' }).replace('.', '')}
                </div>
              </div>

              {/* Day Actions & Slot Count */}
              <div
                style={{
                  padding: '8px 6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: isPastDate ? 'var(--surface-past, #f0f3ef)' : 'var(--surface-subtle, #fafbfa)',
                  borderBottom: '1px solid #edf1ea',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isPastDate ? '#7c8d83' : daySlots.length > 0 ? '#336830' : '#859389',
                    background: isPastDate ? 'var(--surface-tag, #e6ece4)' : daySlots.length > 0 ? 'var(--badge-bg, #eaf5e7)' : 'var(--surface-subtle, #f0f2ef)',
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
                  disabled={rawDaySlots.length === 0}
                  style={{
                    background: 'transparent',
                    border: '1px solid #ccd9c9',
                    borderRadius: '6px',
                    padding: '3px 6px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: rawDaySlots.length === 0 ? '#a0ada4' : '#3f6d63',
                    cursor: rawDaySlots.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    opacity: rawDaySlots.length === 0 ? 0.6 : 1,
                  }}
                  title={rawDaySlots.length === 0 ? 'Sem horários para replicar' : 'Replicar horários deste dia para uma data futura'}
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
                  isPastDate ? (
                    <div
                      style={{
                        border: '1px dashed #d6dfd5',
                        borderRadius: '8px',
                        padding: '18px 8px',
                        textAlign: 'center',
                        color: '#8b9b90',
                        fontSize: '11px',
                        background: 'var(--surface-subtle, #f8faf7)',
                        margin: 'auto 0',
                      }}
                    >
                      <Icon name="calendar" size={16} />
                      <span style={{ display: 'block', marginTop: '4px', fontWeight: 600 }}>
                        Dia encerrado
                      </span>
                      <small style={{ display: 'block', fontSize: '10px', marginTop: '2px' }}>
                        Data no passado
                      </small>
                    </div>
                  ) : (
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
                  )
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
                            !isPastDate && (
                              <button
                                type="button"
                                onClick={(e) => removeSlot(dateStr, time, e)}
                                disabled={saving}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#ffffff',
                                  cursor: saving ? 'not-allowed' : 'pointer',
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
                            )
                          )}
                        </div>
                      );
                    })}

                    {!isPastDate && (
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
                          background: 'var(--surface-subtle, #f4f8f4)',
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
                    )}
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
                background: 'var(--surface-tag, #edf4ed)',
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
                <p style={{ margin: '2px 0 0', fontWeight: 700, color: 'var(--ink, #273831)', fontSize: '15px' }}>
                  {modalDayName} ({formatDate(modalTargetDate, { day: '2-digit', month: 'long', year: 'numeric' })})
                </p>
              </div>

              {/* Selector to quickly switch day of the week (only shows future/current days) */}
              <select
                id="modal-target-date"
                name="modalTargetDate"
                value={modalTargetDate}
                onChange={(e) => handleModalDateChange(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #bcc9b9',
                  background: 'var(--surface-card, #ffffff)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {currentWeek
                  .filter((d) => d >= today())
                  .map((d) => {
                    const dayIdx = currentWeek.indexOf(d);
                    return (
                      <option key={d} value={d}>
                        {WEEKDAY_NAMES[dayIdx]} ({d.slice(-2)}/{d.split('-')[1]})
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Mode 1: Add a specific time */}
            <div
              style={{
                border: '1px solid #e1e7de',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '14px',
                background: 'var(--surface-card, #ffffff)',
              }}
            >
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink, #273831)', margin: '0 0 10px' }}>
                1. Adicionar um horário específico:
              </h4>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  id="single-time-slot"
                  name="singleTimeSlot"
                  type="time"
                  min={modalTargetDate === today() ? getNowTimeStr() : undefined}
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
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : <><Icon name="plus" size={14} /> Adicionar Horário</>}
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
                background: 'var(--surface-card, #ffffff)',
              }}
            >
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink, #273831)', margin: '0 0 10px' }}>
                2. Adicionar por faixa de horários (Ex: Manhã ou Tarde):
              </h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <label htmlFor="interval-start" style={{ fontSize: '12px', color: '#55655d' }}>
                  De:
                  <input
                    id="interval-start"
                    name="intervalStart"
                    type="time"
                    min={modalTargetDate === today() ? getNowTimeStr() : undefined}
                    value={intervalStart}
                    onChange={(e) => setIntervalStart(e.target.value)}
                    style={{ marginLeft: '6px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ccd6c7' }}
                  />
                </label>

                <label htmlFor="interval-end" style={{ fontSize: '12px', color: '#55655d' }}>
                  Até:
                  <input
                    id="interval-end"
                    name="intervalEnd"
                    type="time"
                    value={intervalEnd}
                    onChange={(e) => setIntervalEnd(e.target.value)}
                    style={{ marginLeft: '6px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ccd6c7' }}
                  />
                </label>

                <label htmlFor="interval-step" style={{ fontSize: '12px', color: '#55655d' }}>
                  Intervalo:
                  <select
                    id="interval-step"
                    name="intervalStep"
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
                  disabled={saving}
                >
                  {saving ? 'Gerando...' : '+ Gerar Faixa de Horários'}
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
                background: 'var(--surface-card, #ffffff)',
              }}
            >
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink, #273831)', margin: '0 0 8px' }}>
                3. Seleção direta de horários:
              </h4>
              <small style={{ display: 'block', color: '#74847b', marginBottom: '10px' }}>
                {modalTargetDate === today()
                  ? 'Exibindo apenas horários futuros para o dia de hoje. Clique para ativar ou desativar:'
                  : 'Clique nos botões abaixo para ativar (verde) ou desativar para este dia:'}
              </small>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))', gap: '6px' }}>
                {availablePopularSlots.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', fontSize: '12px', color: '#74847b', fontStyle: 'italic', padding: '8px 0' }}>
                    Não há horários restantes na grade padrão para o dia de hoje.
                  </div>
                ) : (
                  availablePopularSlots.map((time) => {
                    const isSelected = modalCurrentSlots.includes(time);
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => togglePopularSlot(time)}
                        disabled={saving}
                        style={{
                          padding: '6px 4px',
                          borderRadius: '6px',
                          border: isSelected ? '1px solid #3f6d63' : '1px solid #d7dfd3',
                          background: isSelected ? 'var(--primary-dark, #3f6d63)' : 'var(--surface-subtle, #f8faf7)',
                          color: isSelected ? '#ffffff' : '#3c4c44',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {time} {isSelected ? '✓' : ''}
                      </button>
                    );
                  })
                )}
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
                  background: 'var(--surface-subtle, #f4f8f4)',
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
                    name="sourceReplicateDate"
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
                      background: 'var(--surface-card, #ffffff)',
                      color: 'var(--ink, #23382f)',
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
                  background: 'var(--surface-card, #ffffff)',
                  border: isTargetDatePast ? '1.5px solid #e57373' : '1.5px solid #d2e1cf',
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
                      color: isTargetDatePast ? '#b91c1c' : '#2d5442',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Icon name="calendar" size={16} /> 2. Data de Destino (Apenas datas futuras):
                  </label>
                  <small style={{ fontSize: '11px', color: '#687b70' }}>Dia / Mês / Ano (a partir de hoje)</small>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    id="replicate-target-date"
                    name="targetReplicateDate"
                    ref={targetInputRef}
                    type="date"
                    min={today()}
                    value={targetReplicateDate}
                    onChange={(e) => setTargetReplicateDate(e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: isTargetDatePast ? '1.5px solid #d32f2f' : '1.5px solid #a3beaf',
                      fontSize: '15px',
                      fontWeight: 700,
                      background: isTargetDatePast ? '#fff5f5' : 'var(--surface-card, #ffffff)',
                      color: 'var(--ink, #23382f)',
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

                {isTargetDatePast && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#b91c1c', fontWeight: 600, background: '#fee2e2', padding: '8px 12px', borderRadius: '8px' }}>
                    ⚠️ A data de destino não pode ser uma data passada. Só é possível replicar para datas futuras a partir de hoje ({formatDate(today())}).
                  </div>
                )}

                {validDate(targetReplicateDate) && !isTargetDatePast && (
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
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="button primary"
                onClick={handleConfirmReplication}
                disabled={saving || !validDate(sourceReplicateDate) || !validDate(targetReplicateDate) || isTargetDatePast || targetReplicateDate === sourceReplicateDate || sourceSlots.length === 0}
              >
                {saving ? 'Replicando...' : <><Icon name="clipboard" size={16} /> Replicar Horários</>}
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
      </fieldset>
    </div>
  );
}
export { GerenciadorAgendaMedico as DoctorScheduleManager };
