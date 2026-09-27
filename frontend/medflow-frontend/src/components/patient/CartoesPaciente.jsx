import { Link } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import { Avatar } from '../common/InterfaceUI';
import Icone from '../common/Icone';
import { allSlots, slotUnavailable } from '../../utils/appointments';
import { addDays, today, formatDate } from '../../utils/date';

export function CartaoEspecialidade({ specialty, onSelect }) {
  return (
    <button className="specialty-card" onClick={() => onSelect(specialty.id)}>
      <span className={`icon-box ${specialty.color}`}>
        <Icone name={specialty.icon} size={25} />
      </span>
      <h3>{specialty.name}</h3>
      <p>{specialty.description}</p>
      <span className="specialty-arrow">
        <Icone name="arrow" size={18} />
      </span>
    </button>
  );
}
export const SpecialtyCard = CartaoEspecialidade;

export function CartaoMedico({ doctor, onSelect }) {
  const { data } = useDemo();
  let next;
  for (let day = 0; day < 14 && !next; day++) {
    const date = addDays(today(), day);
    const time = allSlots.find((t) => !slotUnavailable(data, doctor.id, date, t));
    if (time) next = { date, time };
  }
  return (
    <article className="doctor-card">
      <div className="doctor-intro">
        <Avatar person={doctor} large />
        <span className="rating">
          <Icone name="star" size={13} />
          {doctor.rating}
        </span>
      </div>
      <h3>{doctor.name}</h3>
      <p>{data.specialties.find((s) => s.id === doctor.specialtyId).name}</p>
      <small>
        <Icone name="pin" size={14} />
        {data.clinic.name}
        <br />
        {doctor.city}
      </small>
      <div className="next-slot">
        <span>Próximo horário disponível</span>
        <strong>
          {next
            ? `${next.date === today() ? 'Hoje' : formatDate(next.date)} às ${next.time}`
            : 'Consulte a agenda'}
        </strong>
      </div>
      {onSelect ? (
        <button className="button secondary full-width" onClick={() => onSelect(doctor.id)}>
          Selecionar profissional <Icone name="arrow" size={16} />
        </button>
      ) : (
        <Link
          className="button secondary full-width"
          to={`/paciente/agendar?especialidade=${doctor.specialtyId}`}
        >
          Agendar consulta
        </Link>
      )}
    </article>
  );
}
export const DoctorCard = CartaoMedico;
