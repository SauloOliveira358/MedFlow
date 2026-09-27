import { useDemo } from '../../context/DemoContext';
import { allSlots, slotUnavailable } from '../../utils/appointments';
import { addDays, today, formatDate } from '../../utils/date';
import Icon from './Icon';
export function TimeSlotPicker({ doctorId, date, value, onChange, excludeId }) {
  const { data } = useDemo();
  const free = allSlots.some((time) => !slotUnavailable(data, doctorId, date, time, excludeId));
  return (
    <div>
      <div className="section-heading">
        <h3>Escolha seu horário</h3>
        <small>
          <span className="legend-dot" /> Disponível <span className="legend-dot blocked" />{' '}
          Indisponível
        </small>
      </div>
      <div className="time-slots">
        {allSlots.map((time) => (
          <button
            key={time}
            disabled={slotUnavailable(data, doctorId, date, time, excludeId)}
            className={value === time ? 'selected' : ''}
            onClick={() => onChange(time)}
            type="button"
            aria-pressed={value === time}
          >
            {time}
          </button>
        ))}
      </div>
      {!free && (
        <p className="inline-message">Não há horários livres nesta data. Escolha outro dia.</p>
      )}
      <small className="schedule-help">
        <Icon name="clock" size={14} />
        Consultas de 30 minutos. Intervalo da equipe: 12h–13h.
      </small>
    </div>
  );
}
export function DatePicker({ value, onChange }) {
  return (
    <div className="date-picker">
      <div className="section-heading">
        <h3>Qual o melhor dia para você?</h3>
        <label className="calendar-input">
          <Icon name="calendar" size={16} />
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
        {Array.from({ length: 7 }, (_, i) => addDays(today(), i)).map((date, i) => (
          <button
            type="button"
            key={date}
            onClick={() => onChange(date)}
            className={date === value ? 'selected' : ''}
            aria-pressed={date === value}
          >
            <span>
              {i === 0
                ? 'Hoje'
                : i === 1
                  ? 'Amanhã'
                  : formatDate(date, { weekday: 'short' }).replace('.', '')}
            </span>
            <strong>{date.slice(-2)}</strong>
            <small>{formatDate(date, { month: 'short' }).replace('.', '')}</small>
          </button>
        ))}
      </div>
      {value > addDays(today(), 6) && (
        <p className="inline-message">
          Selecionado: {formatDate(value, { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      )}
    </div>
  );
}
