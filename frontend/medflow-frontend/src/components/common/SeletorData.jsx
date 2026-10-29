import { useMemo, useEffect } from 'react';
import { useRemoteAgenda } from '../../hooks/useRemoteAgenda';
import { useDemo } from '../../context/DemoContext';
import { slotUnavailable, getDoctorSlotsForDate } from '../../utils/appointments';
import { addDays, today, formatDate, validDate } from '../../utils/date';
import Icone from './Icone';

export function SeletorHorario({ doctorId, date, value, onChange, excludeId }) {
  const { data } = useDemo();
  const { loading, error } = useRemoteAgenda(doctorId, [date]);
  
  // Obter apenas os horários disponibilizados pelo médico nesta data
  const doctorLiberated = getDoctorSlotsForDate(data, doctorId, date);
  
  // Filtrar apenas os horários que estão estritamente disponíveis (sem horários ocupados ou passados)
  const availableSlots = doctorLiberated
    .filter((time) => !slotUnavailable(data, doctorId, date, time, excludeId))
    .sort();

  return (
    <div>
      <div className="section-heading">
        <h3>Escolha seu horário</h3>
        {availableSlots.length > 0 && (
          <small>
            <span className="legend-dot" /> {availableSlots.length} {availableSlots.length === 1 ? 'horário livre' : 'horários livres'}
          </small>
        )}
      </div>

      {loading && <p role="status">Carregando horários...</p>}
      {error && <p role="alert">Não foi possível carregar os horários: {error}</p>}

      {!loading && availableSlots.length > 0 ? (
        <div className="time-slots">
          {availableSlots.map((time) => (
            <button
              key={time}
              className={value === time ? 'selected' : ''}
              onClick={() => onChange(time)}
              type="button"
              aria-pressed={value === time}
            >
              {time}
            </button>
          ))}
        </div>
      ) : !loading ? (
        <div
          className="empty-time-slots"
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            background: 'var(--surface-subtle, #f8faf7)',
            borderRadius: '12px',
            border: '1px dashed #ccd9cb',
            margin: '12px 0',
          }}
        >
          <Icone name="clock" size={24} style={{ color: '#54867b', opacity: 0.7, marginBottom: '6px' }} />
          <p style={{ margin: '4px 0 2px', fontWeight: 600, color: 'var(--ink, #273831)', fontSize: '14px' }}>
            Nenhum horário disponível para esta data
          </p>
          <small style={{ color: '#68776f', fontSize: '12px' }}>
            O profissional não possui horários livres neste dia. Por favor, selecione outro dia disponível no calendário acima.
          </small>
        </div>
      ) : null}

      <small className="schedule-help">
        <Icone name="clock" size={14} />
        Horários disponibilizados diretamente pelo profissional.
      </small>
    </div>
  );
}
export const TimeSlotPicker = SeletorHorario;

export function SeletorData({ value, onChange, doctorId, excludeId }) {
  const { data } = useDemo();

  // Próximos 21 dias candidatos a partir de hoje
  const upcomingCandidates = useMemo(
    () => Array.from({ length: 21 }, (_, i) => addDays(today(), i)),
    []
  );

  // Carrega a agenda do profissional para as próximas 2 semanas se aplicável
  const { loading } = useRemoteAgenda(doctorId, upcomingCandidates.slice(0, 14));

  const hasAvailableSlots = (dateToCheck) => {
    if (!doctorId || !validDate(dateToCheck) || dateToCheck < today()) return false;
    const slots = getDoctorSlotsForDate(data, doctorId, dateToCheck);
    return slots.some((time) => !slotUnavailable(data, doctorId, dateToCheck, time, excludeId));
  };

  // Filtra apenas as datas que realmente possuem horários livres
  const availableDays = useMemo(() => {
    if (!doctorId) {
      return upcomingCandidates.slice(0, 7);
    }
    return upcomingCandidates.filter(hasAvailableSlots);
  }, [upcomingCandidates, data, doctorId, excludeId]);

  // Se a data selecionada atualmente não possui vagas livres, auto-seleciona a primeira data disponível
  useEffect(() => {
    if (doctorId && availableDays.length > 0) {
      if (!value || !hasAvailableSlots(value)) {
        onChange(availableDays[0]);
      }
    }
  }, [availableDays, value, onChange, doctorId]);

  return (
    <div className="date-picker">
      <div className="section-heading">
        <h3>Qual o melhor dia para você?</h3>
        <label className="calendar-input">
          <Icone name="calendar" size={16} />
          <input
            aria-label="Abrir calendário completo"
            type="date"
            min={today()}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      </div>

      <div className="date-strip">
        {availableDays.length > 0 ? (
          availableDays.slice(0, 7).map((date) => {
            const isToday = date === today();
            const isTomorrow = date === addDays(today(), 1);
            return (
              <button
                type="button"
                key={date}
                onClick={() => onChange(date)}
                className={date === value ? 'selected' : ''}
                aria-pressed={date === value}
              >
                <span>
                  {isToday
                    ? 'Hoje'
                    : isTomorrow
                      ? 'Amanhã'
                      : formatDate(date, { weekday: 'short' }).replace('.', '')}
                </span>
                <strong>{date.slice(-2)}</strong>
                <small>{formatDate(date, { month: 'short' }).replace('.', '')}</small>
              </button>
            );
          })
        ) : loading ? (
          <p role="status" style={{ fontSize: '13px', color: '#54867b', padding: '12px' }}>
            Buscando datas disponíveis...
          </p>
        ) : (
          <div
            style={{
              padding: '16px',
              background: 'var(--surface-subtle, #f8faf7)',
              borderRadius: '10px',
              border: '1px dashed #d0dcd0',
              textAlign: 'center',
              width: '100%',
            }}
          >
            <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#33443a', fontSize: '13px' }}>
              Sem datas com horários livres nas próximas semanas
            </p>
            <small style={{ color: '#68776f', fontSize: '12px' }}>
              Você pode selecionar uma data específica pelo calendário acima.
            </small>
          </div>
        )}
      </div>

      {value && !availableDays.includes(value) && (
        <p className="inline-message">
          Selecionado no calendário: {formatDate(value, { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      )}
    </div>
  );
}
export const DatePicker = SeletorData;
