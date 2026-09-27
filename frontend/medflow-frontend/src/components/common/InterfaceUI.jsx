import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Icone from './Icone';

export function Marca() {
  return (
    <Link className="brand" to="/">
      <span className="brand-symbol">
        <Icone name="heart" size={23} />
      </span>
      medflow<span className="brand-period">.</span>
    </Link>
  );
}
export const Brand = Marca;

export function Avatar({ person, large = false }) {
  const photo = person?.photo || person?.logo;
  return photo ? (
    <img
      className={`avatar ${large ? 'large' : ''}`}
      src={photo}
      alt={`Foto ou logo de ${person?.name || 'usuário'}`}
    />
  ) : (
    <span className={`avatar initials ${large ? 'large' : ''}`}>
      {person?.name
        ?.split(' ')
        .filter((n) => !['Dra.', 'Dr.', 'Enf.'].includes(n))
        .map((n) => n[0])
        .slice(0, 2)
        .join('') || 'MF'}
    </span>
  );
}

export function CrachaStatus({ status }) {
  const statusMap = {
    Confirmado: 'confirmed',
    Agendado: 'confirmed',
    Pendente: 'pending',
    'Em atendimento': 'ongoing',
    Concluído: 'completed',
    Compareceu: 'attended',
    'Não compareceu': 'no-show',
    Cancelado: 'cancelled',
  };
  return (
    <span className={`status status-${statusMap[status] || 'completed'}`}>
      <i />
      {status}
    </span>
  );
}
export const StatusBadge = CrachaStatus;

export function CabecalhoPagina({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow || 'CUIDADO QUE CONECTA'}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export const PageHeading = CabecalhoPagina;

export function CartaoMetrica({ label, value, detail, icon = 'calendar', tone = 'sage' }) {
  return (
    <article className="metric">
      <div className={`icon-box ${tone}`}>
        <Icone name={icon} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </article>
  );
}
export const DashboardCard = CartaoMetrica;

export function CampoBusca({ value, onChange, placeholder = 'Buscar', label }) {
  return (
    <label className="search-input">
      <Icone name="search" size={18} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label || placeholder}
      />
    </label>
  );
}
export const SearchInput = CampoBusca;

export function EstadoVazio({
  title = 'Nenhum resultado encontrado',
  description = 'Tente ajustar os filtros para encontrar o que procura.',
  to,
  action = 'Agendar agora',
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icone name="calendar" size={29} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {to && (
        <Link className="button primary" to={to}>
          {action}
          <Icone name="arrow" size={17} />
        </Link>
      )}
    </div>
  );
}
export const EmptyState = EstadoVazio;

export function EsqueletoCarregamento() {
  return (
    <div role="status" aria-label="Carregando página" className="skeleton-page">
      <span className="sr-only">Carregando...</span>
      <div className="skeleton line" />
      <div className="skeleton hero" />
      <div className="metric-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton tile" />
        ))}
      </div>
    </div>
  );
}
export const LoadingSkeleton = EsqueletoCarregamento;

export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'wide' : ''}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
    >
      <div className="modal-top">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Fechar">
          <Icone name="x" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function ModalConfirmacao({
  onClose,
  onConfirm,
  title = 'Cancelar consulta?',
  description = 'O horário será liberado. Você poderá agendar novamente quando precisar.',
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="confirm-copy">
        <div className="icon-box rose">
          <Icone name="calendar" />
        </div>
        <p>{description}</p>
      </div>
      <div className="modal-actions">
        <button className="button secondary" onClick={onClose}>
          Manter consulta
        </button>
        <button className="button danger" onClick={onConfirm}>
          Confirmar cancelamento
        </button>
      </div>
    </Modal>
  );
}
export const ConfirmationModal = ModalConfirmacao;

export function Abas({ items, value, onChange, label = 'Visualização' }) {
  return (
    <div className="tabs" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          key={item}
          className={value === item ? 'selected' : ''}
          aria-pressed={value === item}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
export const Tabs = Abas;

export function Campo({ label, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input {...props} />}
    </label>
  );
}
export const Field = Campo;
