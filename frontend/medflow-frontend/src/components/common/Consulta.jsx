import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import { Avatar, CrachaStatus, Modal, ModalConfirmacao } from './InterfaceUI';
import { age, formatDate } from '../../utils/date';
import Icone from './Icone';
import MapaLocalizacao from './MapaLocalizacao';

export function CartaoConsulta({ appointment, area = 'paciente', onDetails }) {
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
            <Icone name="calendar" size={16} />
            {formatDate(appointment.date)} <b>· {appointment.time}</b>
          </span>
          <CrachaStatus status={appointment.status} />
        </div>
        <div className="appointment-person">
          <Avatar person={area === 'paciente' ? doctor : patient} large />
          <div>
            <h3>{area === 'paciente' ? doctor.name : patient.name}</h3>
            <p>
              {specialty.name}
              {area !== 'paciente' ? ` · ${doctor.name}` : ''}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
              <small>
                <Icone name="pin" size={13} />
                {doctor?.clinic || data.clinic.name}
              </small>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${doctor?.clinic || data.clinic.name}, ${doctor?.address || data.clinic.address}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Abrir no Google Maps"
                style={{
                  fontSize: '11px',
                  color: '#0d9488',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                Maps ↗
              </a>
            </div>
          </div>
        </div>
        <div className="appointment-card-bottom">
          <span>
            <Icone name="clock" size={15} />
            30 minutos · Presencial
          </span>
          <button className="text-button" onClick={() => onDetails(appointment)}>
            Ver detalhes <Icone name="arrow" size={16} />
          </button>
        </div>
        {area === 'paciente' && ['Confirmado', 'Pendente'].includes(appointment.status) && (
          <div className="patient-card-actions">
            <button
              className="text-button cancel-link"
              onClick={() => setCancelOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Icone name="x" size={14} />
              Cancelar consulta
            </button>
          </div>
        )}
      </article>
      {cancelOpen && (
        <ModalConfirmacao
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
export const AppointmentCard = CartaoConsulta;

export function ModalDetalhesConsulta({ appointment, area, onClose, onlyCancel = false }) {
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
      <ModalConfirmacao onClose={() => setConfirm(false)} onConfirm={() => update('Cancelado')} />
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
      <CrachaStatus status={appointment.status} />
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
          <dd>
            {patient.name}
            {area !== 'paciente' && patient.cpf ? (
              <small style={{ display: 'block', color: '#68776f' }}>
                CPF: {patient.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')} · Tel: {patient.phone}
              </small>
            ) : null}
            {area !== 'paciente' && patient.email ? (
              <small style={{ display: 'block', color: '#68776f' }}>
                E-mail: {patient.email}
              </small>
            ) : null}
          </dd>
        </div>
        {area === 'paciente' && (
          <div className="full">
            <dt style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icone name="pin" size={15} /> Local da Consulta no Maps
            </dt>
            <dd style={{ marginTop: '6px' }}>
              <div style={{ marginBottom: '6px' }}>
                <strong>{doctor?.clinic || data.clinic.name}</strong>
                <small style={{ display: 'block', color: '#64748b' }}>
                  {doctor?.address || data.clinic.address}
                </small>
              </div>
              <MapaLocalizacao
                clinicName={doctor?.clinic || data.clinic.name}
                address={doctor?.address || data.clinic.address}
                lat={doctor?.lat ?? data.clinic?.lat ?? -19.9227}
                lng={doctor?.lng ?? data.clinic?.lng ?? -43.9451}
                editable={false}
                height={220}
              />
            </dd>
          </div>
        )}
        <div className="full">
          <dt>Motivo informado pelo paciente</dt>
          <dd>{appointment.reason || 'Nenhuma observação informada.'}</dd>
        </div>
      </dl>
      <div className="modal-actions wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {onlyCancel ? (
          <>
            {appointment.status !== 'Cancelado' && (
              <button
                type="button"
                className="button danger-soft"
                onClick={() => setConfirm(true)}
                style={{
                  background: '#fdf2f2',
                  color: '#c9302c',
                  border: '1px solid #f5c6cb',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Icone name="x" size={15} />
                Cancelar Agendamento
              </button>
            )}
            <button type="button" className="button primary" onClick={onClose} style={{ marginLeft: 'auto' }}>
              Fechar
            </button>
          </>
        ) : (
          <>
            {area !== 'paciente' && (
              <Link
                className="button secondary"
                to={record ? `/${area}/prontuarios/${record.id}` : `/${area}/prontuarios`}
                onClick={onClose}
              >
                Ver prontuário
              </Link>
            )}
            {area !== 'paciente' && appointment.status !== 'Cancelado' && (
              <>
                <button
                  type="button"
                  className="button small"
                  style={{
                    background: appointment.status === 'Compareceu' ? '#488c43' : '#f0f8ee',
                    color: appointment.status === 'Compareceu' ? '#ffffff' : '#31692d',
                    border: '1px solid #bee0b9',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 600,
                  }}
                  onClick={() => update('Compareceu')}
                >
                  <Icone name="check" size={14} />
                  {appointment.status === 'Compareceu' ? 'Compareceu ✓' : 'Compareceu'}
                </button>
                <button
                  type="button"
                  className="button small"
                  style={{
                    background: appointment.status === 'Não compareceu' ? '#cb8a27' : '#fdf6eb',
                    color: appointment.status === 'Não compareceu' ? '#ffffff' : '#8d5910',
                    border: '1px solid #f6deb6',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 600,
                  }}
                  onClick={() => update('Não compareceu')}
                >
                  <Icone name="x" size={14} />
                  {appointment.status === 'Não compareceu' ? 'Não compareceu ✓' : 'Não compareceu'}
                </button>
              </>
            )}
            {area !== 'paciente' && area !== 'medico' && canEdit && (
              <button className="button primary" onClick={() => update('Em atendimento')}>
                Iniciar atendimento
              </button>
            )}
            {area !== 'paciente' && area !== 'medico' && appointment.status === 'Em atendimento' && (
              <button className="button primary" onClick={() => update('Concluído')}>
                Concluir atendimento
              </button>
            )}
            {area !== 'medico' && area !== 'paciente' && canEdit && (
              <Link
                className="button secondary"
                to={`/${area}/agendar?reagendar=${appointment.id}`}
                onClick={onClose}
              >
                Reagendar
              </Link>
            )}
            {appointment.status !== 'Cancelado' && (
              <button
                type="button"
                className="button danger-soft"
                onClick={() => setConfirm(true)}
                style={{
                  background: '#fdf2f2',
                  color: '#c9302c',
                  border: '1px solid #f5c6cb',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Icone name="x" size={14} />
                Cancelar
              </button>
            )}
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
              style={{ marginLeft: 'auto' }}
            >
              Fechar
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
export const AppointmentDetailsModal = ModalDetalhesConsulta;
