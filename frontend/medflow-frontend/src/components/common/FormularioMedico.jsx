import { useState, useRef, useEffect } from 'react';
import { Field } from './InterfaceUI';
import { useDemo } from '../../context/DemoContext';
import Icone from './Icone';
import MapaLocalizacao from './MapaLocalizacao';

export default function FormularioMedico({ value, onChange }) {
  const { data } = useDemo();
  const [customSpecialty, setCustomSpecialty] = useState(false);

  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const updateData = (patch) => {
    if (typeof onChange === 'function') {
      const merged = { ...valueRef.current, ...patch };
      valueRef.current = merged;
      try {
        onChange((prev) => {
          if (typeof prev === 'object' && prev !== null) {
            return { ...prev, ...patch };
          }
          return merged;
        });
      } catch {
        onChange(merged);
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
        {field('name', 'Nome completo do médico(a)', 'text', {
          autoComplete: 'name',
          maxLength: 100,
          placeholder: 'Ex: Mariana Costa (sem Dr/Dra)',
        })}
      </div>

      <div>
        {field('registration', 'CRM / Registro Profissional', 'text', {
          placeholder: 'Ex: CRM 123456/SP',
          maxLength: 30,
        })}
      </div>

      <div>
        {field('phone', 'Telefone / WhatsApp', 'tel', {
          placeholder: '(11) 99999-9999',
          autoComplete: 'tel',
          maxLength: 20,
        })}
      </div>

      <div className="full">
        <label className="field full">
          <span>Especialidade Médica</span>
          {!customSpecialty ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                style={{ flex: 1 }}
                required
                value={value.specialtyId || ''}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setCustomSpecialty(true);
                    updateData({ specialtyId: '', specialtyName: '' });
                  } else {
                    updateData({ specialtyId: e.target.value, specialtyName: '' });
                  }
                }}
              >
                <option value="">Selecione sua especialidade</option>
                {data.specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
                <option value="__custom__">+ Outra especialidade (digitar)</option>
              </select>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Ex: Cardiologia, Pediatria, Ortopedia..."
                required
                value={value.specialtyName || ''}
                onChange={(e) => updateData({ specialtyName: e.target.value, specialtyId: '' })}
              />
              <button
                type="button"
                className="button small secondary"
                onClick={() => {
                  setCustomSpecialty(false);
                  updateData({ specialtyName: '', specialtyId: data.specialties[0]?.id || '' });
                }}
              >
                Voltar à lista
              </button>
            </div>
          )}
        </label>
      </div>

      <div className="full">
        {field('email', 'E-mail profissional', 'email', {
          autoComplete: 'email',
          placeholder: 'medico@exemplo.com',
        })}
      </div>

      <div className="full" style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
        <h3 style={{ fontSize: '15px', color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icone name="pin" size={17} /> Endereço do Estabelecimento & Localização no Maps
        </h3>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px' }}>
          Informe os dados do seu consultório ou clínica e marque no mapa o ponto exato onde a consulta será realizada.
        </p>
      </div>

      <div className="full">
        {field('clinic', 'Nome do Consultório / Clínica', 'text', {
          placeholder: 'Ex: Consultório Dra. Mariana ou Clínica Bem-Estar',
          required: false,
        })}
      </div>

      <div className="full">
        {field('address', 'Endereço completo (Rua, nº, complemento, bairro)', 'text', {
          placeholder: 'Ex: Rua das Flores, 120, Sala 301 - Funcionários',
          required: false,
        })}
      </div>

      <div>
        <Field
          label="Latitude *"
          type="number"
          step="any"
          required
          placeholder="Ex: -19.9227"
          value={value.lat !== undefined ? value.lat : ''}
          onChange={(e) => {
            const val = e.target.value === '' ? '' : Number(e.target.value);
            updateData({ lat: val });
          }}
        />
      </div>

      <div>
        <Field
          label="Longitude *"
          type="number"
          step="any"
          required
          placeholder="Ex: -43.9451"
          value={value.lng !== undefined ? value.lng : ''}
          onChange={(e) => {
            const val = e.target.value === '' ? '' : Number(e.target.value);
            updateData({ lng: val });
          }}
        />
      </div>

      <div className="full">
        <MapaLocalizacao
          lat={typeof value.lat === 'number' && !isNaN(value.lat) ? value.lat : -19.9227}
          lng={typeof value.lng === 'number' && !isNaN(value.lng) ? value.lng : -43.9451}
          clinicName={value.clinic || (value.name ? `Consultório ${value.name}` : 'Meu Consultório')}
          address={value.address || 'Belo Horizonte, MG'}
          editable={true}
          onChange={({ lat, lng, address }) => {
            updateData({
              lat,
              lng,
              ...(address ? { address } : {}),
            });
          }}
        />
      </div>
    </div>
  );
}
export { FormularioMedico as DoctorForm };
