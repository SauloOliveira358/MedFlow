import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Brand, Field } from '../components/common/UI';
import PatientForm from '../components/common/PatientForm';
import Icon from '../components/common/Icon';
import { useDemo } from '../context/DemoContext';
export default function Welcome({ register = false }) {
  const { account, login, registerPatient, storageError } = useDemo();
  const location = useLocation();
  const [form, setForm] = useState({
    name: '',
    birth: '',
    phone: '',
    email: '',
    cpf: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  useEffect(() => {
    document.title = register ? 'MedFlow · Criar conta' : 'MedFlow · Entrar';
  }, [register]);
  const destinationFor = (user) => {
    const from = location.state?.from;
    return typeof from === 'string' &&
      (from === `/${user.role}` || from.startsWith(`/${user.role}/`))
      ? from
      : register && user.role === 'paciente'
        ? '/paciente/agendar'
        : `/${user.role}`;
  };
  if (account) return <Navigate to={destinationFor(account)} replace />;
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (register && form.password !== form.confirm) {
      setError('As senhas precisam ser iguais.');
      return;
    }
    setBusy(true);
    try {
      if (register) await registerPatient(form);
      else await login(form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-page">
      <header>
        <Brand />
        <span className="demo-pill">Ambiente demonstrativo</span>
      </header>
      <main className={`auth-layout ${register ? 'register-layout' : ''}`}>
        <section className="auth-story">
          <span className="eyebrow">CUIDADO QUE CONECTA</span>
          <h1>
            Seu cuidado começa
            <br />
            <em>onde você estiver.</em>
          </h1>
          <p>
            Crie sua conta, encontre um especialista e agende sua consulta sem precisar ir à
            clínica.
          </p>
          <div className="auth-benefits">
            {[
              [
                'calendar',
                'Agende no seu tempo',
                'Escolha o dia e o horário que combinam com você.',
              ],
              ['heart', 'Seu cuidado, bem perto', 'Acompanhe suas consultas em um só lugar.'],
              [
                'shield',
                'Um espaço para cada pessoa',
                'Pacientes, profissionais e clínica com acessos próprios.',
              ],
            ].map(([icon, title, text]) => (
              <div key={icon}>
                <span className="icon-box sage">
                  <Icon name={icon} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
          <small>
            Profissional de saúde? Seu acesso é cadastrado pela administração da clínica.
          </small>
        </section>
        <section className="auth-card">
          <span className="eyebrow">
            {register ? 'SEU PRIMEIRO PASSO' : 'BEM-VINDO AO MEDFLOW'}
          </span>
          <h2>{register ? 'Crie sua conta de paciente' : 'Bom ter você aqui.'}</h2>
          <p>
            {register
              ? 'Cadastre-se de onde estiver e comece a cuidar de você.'
              : 'Entre para acessar seu espaço de cuidado.'}
          </p>
          <form onSubmit={submit}>
            {register ? (
              <PatientForm value={form} onChange={setForm} />
            ) : (
              <Field
                label="E-mail"
                type="email"
                autoComplete="username"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="seu@email.com"
              />
            )}
            <div className="password-field">
              <Field
                label="Senha"
                type={show ? 'text' : 'password'}
                autoComplete={register ? 'new-password' : 'current-password'}
                required
                minLength={register ? 8 : undefined}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={register ? 'Pelo menos 8 caracteres' : 'Digite sua senha'}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShow(!show)}
                aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {show ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {register && (
              <Field
                label="Confirmar senha"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />
            )}
            <div aria-live="polite">
              {error && (
                <p className="error-message" role="alert">
                  {error}
                </p>
              )}
              {storageError && (
                <p className="error-message" role="alert">
                  {storageError}
                </p>
              )}
            </div>
            <button className="button primary full-width" disabled={busy}>
              {busy ? 'Aguarde...' : register ? 'Criar conta e continuar' : 'Entrar'}
              <Icon name="arrow" size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {register ? 'Já tem uma conta?' : 'É paciente e ainda não tem conta?'}{' '}
            <Link to={register ? '/' : '/cadastro'}>
              {register ? 'Entrar' : 'Criar minha conta'}
            </Link>
          </p>
          {!register && (
            <details className="demo-credentials">
              <summary>Contas para conhecer a demonstração</summary>
              <p>
                Paciente: maria@medflow.demo
                <br />
                Médico: ana@medflow.demo
                <br />
                Administrador: admin@medflow.demo
              </p>
              <p>
                Senha de teste: <strong>MedFlow123!</strong>
              </p>
            </details>
          )}
          <small className="auth-local-note">
            Protótipo local. Utilize apenas dados e senhas fictícios.
          </small>
        </section>
      </main>
      <footer>MedFlow · Cuidado mais próximo, em cada momento.</footer>
    </div>
  );
}
