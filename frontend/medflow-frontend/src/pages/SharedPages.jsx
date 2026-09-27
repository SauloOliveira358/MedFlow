import { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { PageHeading, Avatar, Field, EmptyState } from '../components/common/UI';
import PatientForm from '../components/common/PatientForm';
import Icon from '../components/common/Icon';
export function Notifications({ area }) {
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
export function Profile({ area }) {
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
function ProfileForm({ source, area, save }) {
  const [form, setForm] = useState({ ...source });
  const [error, setError] = useState('');
  return (
    <>
      <PageHeading title="Meu perfil" description="Seus dados, sempre por perto e atualizados." />
      <section className="panel profile-panel">
        <div className="detail-person">
          <Avatar person={form} large />
          <div>
            <h2>{form.name}</h2>
            <p>{area === 'paciente' ? 'Seu espaço de cuidado' : 'Seu perfil profissional'}</p>
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
            <PatientForm value={form} onChange={setForm} />
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
              <label className="field full">
                <span>Sobre o seu atendimento</span>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  maxLength={500}
                />
              </label>
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
export function Settings() {
  const { data, saveClinic } = useDemo();
  const [form, setForm] = useState(data.clinic);
  return (
    <>
      <PageHeading
        title="Configurações da clínica"
        description="A identidade do seu espaço de cuidado."
      />
      <section className="panel profile-panel">
        <h2>Informações da clínica</h2>
        <p className="form-intro">
          As alterações aparecem nos resumos de agendamento das três áreas.
        </p>
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
          </div>
          <div className="modal-actions">
            <button className="button primary">Salvar configurações</button>
          </div>
        </form>
      </section>
    </>
  );
}
