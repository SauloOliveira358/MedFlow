import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import { Avatar, StatusBadge, Modal, ConfirmationModal } from './UI';
import { age, formatDate } from '../../utils/date';
import Icon from './Icon';
export function AppointmentCard({ appointment, area = 'paciente', onDetails }) {
  const { data, status, notify } = useDemo();
  const [cancelOpen, setCancelOpen] = useState(false);
  const doctor = data.doctors.find((d) => d.id === appointment.doctorId);
  const patient = data.patients.find((p) => p.id === appointment.patientId);
  const specialty = data.specialties.find((s) => s.id === doctor.specialtyId);
  return (
    <>
      <article className="appointment-card">
        <div className="appointment-card-top">
          <span className="date-stamp">
            <Icon name="calendar" size={16} />
            {formatDate(appointment.date)} <b>· {appointment.time}</b>
          </span>
          <StatusBadge status={appointment.status} />
        </div>
        <div className="appointment-person">
          <Avatar person={area === 'paciente' ? doctor : patient} large />
          <div>
            <h3>{area === 'paciente' ? doctor.name : patient.name}</h3>
            <p>
              {specialty.name}
              {area !== 'paciente' ? ` · ${doctor.name}` : ''}
            </p>
            <small>
              <Icon name="pin" size={13} />
              {data.clinic.name}
            </small>
          </div>
        </div>
        <div className="appointment-card-bottom">
          <span>
            <Icon name="clock" size={15} />
            30 minutos · Presencial
          </span>
          <button className="text-button" onClick={() => onDetails(appointment)}>
            Ver detalhes <Icon name="arrow" size={16} />
          </button>
        </div>
        {area === 'paciente' && ['Confirmado', 'Pendente'].includes(appointment.status) && (
          <div className="patient-card-actions">
            <Link className="text-button" to={`/paciente/agendar?reagendar=${appointment.id}`}>
              Reagendar
            </Link>
            <button className="text-button cancel-link" onClick={() => setCancelOpen(true)}>
              Cancelar
            </button>
          </div>
        )}
      </article>
      {cancelOpen && (
        <ConfirmationModal
          onClose={() => setCancelOpen(false)}
          onConfirm={() => {
            try {
              status(appointment.id, 'Cancelado');
              setCancelOpen(false);
            } catch (error) {
              notify(error.message, 'error');
            }
          }}
        />
      )}
    </>
  );
}
export function AppointmentDetailsModal({ appointment, area, onClose }) {
  const { data, status, notify } = useDemo();
  const [confirm, setConfirm] = useState(false);
  const doctor = data.doctors.find((d) => d.id === appointment.doctorId);
  const patient = data.patients.find((p) => p.id === appointment.patientId);
  const record = data.records.find((r) => r.patientId === patient.id && r.doctorId === doctor.id);
  const canEdit = ['Confirmado', 'Pendente'].includes(appointment.status);
  const update = (value) => {
    try {
      status(appointment.id, value);
      onClose();
    } catch (e) {
      notify(e.message, 'error');
    }
  };
  if (confirm)
    return (
      <ConfirmationModal onClose={() => setConfirm(false)} onConfirm={() => update('Cancelado')} />
    );
  return (
    <Modal title="Detalhes da consulta" onClose={onClose}>
      <div className="detail-person">
        <Avatar person={area === 'paciente' ? doctor : patient} large />
        <div>
          <h3>{area === 'paciente' ? doctor.name : patient.name}</h3>
          <p>
            {area === 'paciente'
              ? data.specialties.find((s) => s.id === doctor.specialtyId).name
              : `${age(patient.birth)} anos · ${patient.phone}`}
          </p>
        </div>
      </div>
      <StatusBadge status={appointment.status} />
      <dl className="detail-grid">
        <div>
          <dt>Data</dt>
          <dd>
            {formatDate(appointment.date, { day: '2-digit', month: 'long', year: 'numeric' })}
          </dd>
        </div>
        <div>
          <dt>Horário</dt>
          <dd>{appointment.time} · 30 min</dd>
        </div>
        <div>
          <dt>Profissional</dt>
          <dd>{doctor.name}</dd>
        </div>
        <div>
          <dt>Paciente</dt>
          <dd>{patient.name}</dd>
        </div>
        <div className="full">
          <dt>Local</dt>
          <dd>
            {data.clinic.name}
            <small>{data.clinic.address}</small>
          </dd>
        </div>
        <div className="full">
          <dt>Motivo informado pelo paciente</dt>
          <dd>{appointment.reason || 'Nenhuma observação informada.'}</dd>
        </div>
      </dl>
      <div className="modal-actions wrap">
        {area !== 'paciente' && (
          <Link
            className="button secondary"
            to={record ? `/${area}/prontuarios/${record.id}` : `/${area}/prontuarios`}
            onClick={onClose}
          >
            Ver prontuário
          </Link>
        )}
        {area !== 'paciente' && canEdit && (
          <button className="button primary" onClick={() => update('Em atendimento')}>
            Iniciar atendimento
          </button>
        )}
        {area !== 'paciente' && appointment.status === 'Em atendimento' && (
          <button className="button primary" onClick={() => update('Concluído')}>
            Concluir atendimento
          </button>
        )}
        {canEdit && (
          <>
            <Link
              className="button secondary"
              to={`/${area}/agendar?reagendar=${appointment.id}`}
              onClick={onClose}
            >
              Reagendar
            </Link>
            <button className="button danger-soft" onClick={() => setConfirm(true)}>
              Cancelar
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
