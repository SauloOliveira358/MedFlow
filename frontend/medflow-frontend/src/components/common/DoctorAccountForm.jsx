import { useState } from 'react';
import { Modal, Field } from './UI';
import { useDemo } from '../../context/DemoContext';
export default function DoctorAccountForm({ onClose }) {
  const { data, registerDoctor } = useDemo();
  const [form, setForm] = useState({
    name: '',
    registration: '',
    specialtyId: '',
    phone: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('As senhas precisam ser iguais.');
      return;
    }
    setBusy(true);
    try {
      await registerDoctor(form);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Cadastrar conta de médico" onClose={busy ? () => {} : onClose}>
      <p className="form-intro">
        Somente a administração da clínica pode criar este acesso. Informe ao profissional o e-mail
        e a senha de teste cadastrados.
      </p>
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field
            label="Nome do profissional"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            minLength={3}
          />
          <label className="field">
            <span>Especialidade</span>
            <select
              value={form.specialtyId}
              onChange={(e) => setForm({ ...form, specialtyId: e.target.value })}
              required
            >
              <option value="">Selecione</option>
              {data.specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Registro profissional"
            placeholder="CRM / CRP / CRN e número"
            required
            value={form.registration}
            onChange={(e) => setForm({ ...form, registration: e.target.value })}
          />
          <Field
            label="Telefone"
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <div className="full">
            <Field
              label="E-mail de acesso"
              type="email"
              autoComplete="off"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <Field
            label="Senha de acesso"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Field
            label="Confirmar senha"
            type="password"
            autoComplete="new-password"
            required
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          />
        </div>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onClose} disabled={busy}>
            Voltar
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? 'Cadastrando...' : 'Criar conta do médico'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
