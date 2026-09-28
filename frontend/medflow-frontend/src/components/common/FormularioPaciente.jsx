import { Field } from './InterfaceUI';
import { today } from '../../utils/date';

export default function FormularioPaciente({ value, onChange, notes = false }) {
  const updateData = (patch) => {
    if (typeof onChange === 'function') {
      try {
        onChange((prev) => (typeof prev === 'object' && prev !== null ? { ...prev, ...patch } : { ...value, ...patch }));
      } catch {
        onChange({ ...value, ...patch });
      }
    }
  };

  const field = (key, label, type = 'text', props = {}) => (
    <Field
      label={label}
      type={type}
      value={value[key] || ''}
      onChange={(e) => updateData({ [key]: e.target.value })}
      required
      {...props}
    />
  );
  return (
    <div className="form-grid">
      <div className="full">
        {field('name', 'Nome completo', 'text', { autoComplete: 'name', maxLength: 100 })}
      </div>
      {field('birth', 'Data de nascimento', 'date', { max: today(), min: '1900-01-01' })}
      {field('phone', 'Telefone', 'tel', {
        placeholder: '(31) 99999-9999',
        autoComplete: 'tel',
        maxLength: 20,
      })}
      {field('email', 'E-mail', 'email', {
        autoComplete: 'email',
        placeholder: 'voce@exemplo.com',
      })}
      {field('cpf', 'CPF', 'text', {
        inputMode: 'numeric',
        placeholder: '000.000.000-00',
        maxLength: 14,
      })}
      {notes && (
        <label className="field full">
          <span>
            Deseja informar algo ao profissional? <small>(opcional)</small>
          </span>
          <textarea
            value={value.reason || ''}
            onChange={(e) => onChange({ ...value, reason: e.target.value })}
            placeholder="Descreva brevemente o motivo da consulta."
            maxLength={500}
            rows={3}
          />
        </label>
      )}
    </div>
  );
}
export { FormularioPaciente as PatientForm };
