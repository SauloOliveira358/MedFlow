import { useState, useRef } from 'react';
import { useDemo } from '../context/DemoContext';
import { PageHeading, Avatar, Field, EmptyState } from '../components/common/InterfaceUI';
import FormularioPaciente from '../components/common/FormularioPaciente';
import Icone from '../components/common/Icone';
import MapaLocalizacao from '../components/common/MapaLocalizacao';

const Icon = Icone;
const LocationMap = MapaLocalizacao;
const PatientForm = FormularioPaciente;

export function Notificacoes({ area }) {
  const { data, patientId, doctorId, markRead } = useDemo();
  const viewer = area === 'paciente' ? patientId : doctorId;
  const rows = data.notifications.filter((n) =>
    area === 'paciente' ? n.patientId === patientId : n.doctorId === doctorId,
  );
  return (
    <>
      <PageHeading
        title="Notificações"
        description="Acompanhe cada novidade do seu cuidado."
        action={
          <button
            className="button secondary"
            onClick={() => markRead(viewer)}
            disabled={rows.every((n) => n.readBy.includes(viewer))}
          >
            Marcar todas como lidas
          </button>
        }
      />
      <section className="panel notifications">
        {rows.map((n) => (
          <article key={n.id} className={n.readBy.includes(viewer) ? 'read' : ''}>
            <span className="icon-box sage">
              <Icon name="bell" />
            </span>
            <div>
              <h3>{n.title}</h3>
              <p>{n.message}</p>
              <small>{new Date(n.at).toLocaleString('pt-BR')}</small>
            </div>
            {!n.readBy.includes(viewer) && <span className="unread-dot" aria-label="Não lida" />}
          </article>
        ))}
        {!rows.length && (
          <EmptyState
            title="Tudo tranquilo por aqui"
            description="Você verá aqui as novidades dos agendamentos."
          />
        )}
      </section>
    </>
  );
}

export const Notifications = Notificacoes;

export function Perfil({ area }) {
  const { data, patientId, doctorId, savePatient, saveDoctor } = useDemo();
  const source =
    area === 'paciente'
      ? data.patients.find((p) => p.id === patientId)
      : data.doctors.find((d) => d.id === doctorId);
  return (
    <ProfileForm
      key={source.id}
      source={source}
      area={area}
      save={area === 'paciente' ? savePatient : saveDoctor}
    />
  );
}
export const Profile = Perfil;
function ProfileForm({ source, area, save }) {
  const [form, setForm] = useState({ ...source });
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('A foto deve ter no máximo 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => ({ ...prev, photo: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, photo: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <PageHeading title="Meu perfil" description="Seus dados, sempre por perto e atualizados." />
      <section className="panel profile-panel">
        <div
          className="detail-person"
          style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}
        >
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Avatar person={form} large />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                background: '#0d9488',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '2px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
              }}
              title="Carregar foto de perfil"
              aria-label="Carregar foto de perfil"
            >
              <Icon name="camera" size={15} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
          </div>
          <div>
            <h2>{form.name}</h2>
            <p>{area === 'paciente' ? 'Seu espaço de cuidado' : 'Seu perfil profissional'}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="button small secondary"
                onClick={() => fileInputRef.current?.click()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Icon name="camera" size={14} />
                {form.photo ? 'Alterar foto' : 'Adicionar foto'}
              </button>
              {form.photo && (
                <button
                  type="button"
                  className="button small danger-soft"
                  onClick={handleRemovePhoto}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#c9302c',
                    background: '#fdf2f2',
                    border: '1px solid #f5c6cb',
                  }}
                >
                  <Icon name="x" size={14} />
                  Remover foto
                </button>
              )}
            </div>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError('');
            try {
              if (!form.name.trim()) throw new Error('Informe seu nome.');
              save(form);
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          {area === 'paciente' ? (
            <FormularioPaciente value={form} onChange={setForm} />
          ) : (
            <div className="form-grid">
              <Field
                label="Nome profissional"
                value={form.name}
                required
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Field
                label="Registro profissional"
                value={form.registration}
                required
                onChange={(e) => setForm({ ...form, registration: e.target.value })}
              />
              <Field
                label="E-mail"
                type="email"
                value={form.email}
                required
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Field
                label="Telefone"
                type="tel"
                value={form.phone}
                required
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Field
                label="Nome do Consultório / Clínica"
                value={form.clinic || ''}
                placeholder="Ex: Consultório Particular"
                onChange={(e) => setForm({ ...form, clinic: e.target.value })}
              />
              <Field
                label="Endereço do Estabelecimento"
                value={form.address || ''}
                placeholder="Ex: Rua das Flores, 120"
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <label className="field full">
                <span>Sobre o seu atendimento</span>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  maxLength={500}
                />
              </label>
              <div className="full" style={{ marginTop: '8px' }}>
                <MapaLocalizacao
                  lat={typeof form.lat === 'number' ? form.lat : -19.9227}
                  lng={typeof form.lng === 'number' ? form.lng : -43.9451}
                  clinicName={form.clinic || form.name}
                  address={form.address || form.city || 'Belo Horizonte, MG'}
                  editable={true}
                  onChange={({ lat, lng }) => setForm({ ...form, lat, lng })}
                />
              </div>
            </div>
          )}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button className="button primary">Salvar alterações</button>
          </div>
        </form>
      </section>
    </>
  );
}
export function Configuracoes() {
  const { data, saveClinic } = useDemo();
  const [form, setForm] = useState(data.clinic);
  const [error, setError] = useState('');
  const clinicFileInputRef = useRef(null);

  const handleClinicPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => ({
        ...prev,
        photo: ev.target.result,
        logo: ev.target.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveClinicPhoto = () => {
    setForm((prev) => ({ ...prev, photo: '', logo: '' }));
    if (clinicFileInputRef.current) clinicFileInputRef.current.value = '';
  };

  return (
    <>
      <PageHeading
        title="Configurações da clínica"
        description="A identidade do seu espaço de cuidado."
      />
      <section className="panel profile-panel">
        <h2>Informações e identidade da clínica</h2>
        <p className="form-intro">
          A logo ou foto da empresa aparece na navegação e nos resumos de agendamento das três áreas.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '24px',
            padding: '16px 20px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Avatar person={{ name: form.name, photo: form.photo || form.logo }} large />
            <button
              type="button"
              onClick={() => clinicFileInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                background: '#0d9488',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '2px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
              }}
              title="Carregar logo ou foto da empresa"
              aria-label="Carregar logo ou foto da empresa"
            >
              <Icon name="camera" size={15} />
            </button>
            <input
              ref={clinicFileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleClinicPhotoChange}
            />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#0f172a' }}>
              {form.name || 'Clínica'}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Logo ou foto principal da empresa
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="button small secondary"
                onClick={() => clinicFileInputRef.current?.click()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Icon name="camera" size={14} />
                {form.photo || form.logo ? 'Alterar foto da empresa' : 'Adicionar foto da empresa'}
              </button>
              {(form.photo || form.logo) && (
                <button
                  type="button"
                  className="button small danger-soft"
                  onClick={handleRemoveClinicPhoto}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#c9302c',
                    background: '#fdf2f2',
                    border: '1px solid #f5c6cb',
                  }}
                >
                  <Icon name="x" size={14} />
                  Remover foto
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="error-message" role="alert" style={{ marginBottom: '16px' }}>
            {error}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveClinic(form);
          }}
        >
          <div className="form-grid">
            {[
              ['name', 'Nome da clínica', 'text'],
              ['phone', 'Telefone', 'tel'],
              ['email', 'E-mail', 'email'],
              ['address', 'Endereço', 'text'],
            ].map(([key, label, type]) => (
              <Field
                key={key}
                label={label}
                type={type}
                required
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            ))}

            <div className="full" style={{ marginTop: '8px' }}>
              <MapaLocalizacao
                lat={typeof form.lat === 'number' ? form.lat : -19.9227}
                lng={typeof form.lng === 'number' ? form.lng : -43.9451}
                clinicName={form.name}
                address={form.address}
                editable={true}
                onChange={({ lat, lng }) => setForm({ ...form, lat, lng })}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="button primary">Salvar configurações</button>
          </div>
        </form>
      </section>
    </>
  );
}
export const Settings = Configuracoes;
