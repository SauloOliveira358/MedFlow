import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { Marca, Brand, Field, Campo } from '../components/common/InterfaceUI';
import FormularioPaciente from '../components/common/FormularioPaciente';
import FormularioMedico from '../components/common/FormularioMedico';
import Icone from '../components/common/Icone';
import { useDemo } from '../context/DemoContext';

const Icon = Icone;

export default function BoasVindas({ register = false }) {
  const { account, login, registerPatient, registerDoctor, storageError } = useDemo();
  const location = useLocation();
  const [params] = useSearchParams();

  const [roleType, setRoleType] = useState(() => params.get('tipo') || 'paciente');

  const [patientData, setPatientData] = useState({
    name: '',
    birth: '',
    phone: '',
    email: '',
    cpf: '',
  });

  const [doctorData, setDoctorData] = useState({
    name: '',
    registration: '',
    specialtyId: '',
    specialtyName: '',
    phone: '',
    email: '',
    clinic: '',
    address: '',
    city: 'Belo Horizonte, MG',
    lat: -19.9227,
    lng: -43.9451,
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    document.title = register
      ? `MedFlow · Criar conta (${roleType === 'medico' ? 'Médico' : 'Paciente'})`
      : 'MedFlow · Entrar';
  }, [register, roleType]);

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

    if (register && password !== confirmPassword) {
      setError('As senhas precisam ser iguais.');
      return;
    }

    setBusy(true);
    try {
      if (register) {
        if (roleType === 'medico') {
          if (
            doctorData.lat === '' ||
            doctorData.lat === undefined ||
            isNaN(Number(doctorData.lat)) ||
            doctorData.lng === '' ||
            doctorData.lng === undefined ||
            isNaN(Number(doctorData.lng))
          ) {
            setError('A Latitude e a Longitude do consultório são obrigatórias.');
            setBusy(false);
            return;
          }
          await registerDoctor({
            ...doctorData,
            lat: Number(doctorData.lat),
            lng: Number(doctorData.lng),
            password,
          });
        } else {
          await registerPatient({
            ...patientData,
            password,
          });
        }
      } else {
        await login(loginEmail, password);
      }
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
        <span className="demo-pill">Plataforma Médica & Paciente</span>
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
            Uma plataforma completa conectando médicos e pacientes com agendamento flexível,
            gestão de horários inteligentes e controle presencial de consultas.
          </p>

          <div className="auth-benefits">
            {[
              [
                'stethoscope',
                'Para Médicos e Especialistas',
                'Libere seus dias e horários, replique sua agenda em 1 clique e controle presença (compareceu, não compareceu ou cancelar).',
              ],
              [
                'calendar',
                'Para Pacientes e Usuários',
                'Encontre seu especialista, veja os horários disponíveis em tempo real e agende sua consulta com praticidade.',
              ],
              [
                'shield',
                'Acesso Personalizado',
                'Ambiente dedicado e seguro para cada perfil com fluxo 100% integrado.',
              ],
            ].map(([icon, title, text]) => (
              <div key={title}>
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

        </section>

        <section className="auth-card">
          <span className="eyebrow">
            {register ? 'NOVO CADASTRO NO MEDFLOW' : 'BEM-VINDO AO MEDFLOW'}
          </span>

          <h2>
            {register
              ? roleType === 'medico'
                ? 'Criar conta de Médico'
                : 'Criar conta de Paciente'
              : 'Entre na sua conta'}
          </h2>

          <p>
            {register
              ? roleType === 'medico'
                ? 'Cadastre-se com seu CRM e especialidade para gerenciar sua agenda.'
                : 'Cadastre-se para agendar suas consultas e cuidar da sua saúde.'
              : 'Acesse seu painel com seu e-mail e senha cadastrados.'}
          </p>

          {register && (
            <div
              style={{
                display: 'flex',
                background: '#edf3e9',
                padding: '4px',
                borderRadius: '10px',
                marginBottom: '20px',
                gap: '4px',
              }}
            >
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: roleType === 'paciente' ? '#fff' : 'transparent',
                  color: roleType === 'paciente' ? '#2e473d' : '#697a70',
                  boxShadow: roleType === 'paciente' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
                onClick={() => setRoleType('paciente')}
              >
                <Icon name="user" size={16} /> Sou Paciente
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: roleType === 'medico' ? '#fff' : 'transparent',
                  color: roleType === 'medico' ? '#2e473d' : '#697a70',
                  boxShadow: roleType === 'medico' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
                onClick={() => setRoleType('medico')}
              >
                <Icon name="stethoscope" size={16} /> Sou Médico
              </button>
            </div>
          )}

          <form onSubmit={submit}>
            {register ? (
              roleType === 'medico' ? (
                <FormularioMedico value={doctorData} onChange={setDoctorData} />
              ) : (
                <FormularioPaciente value={patientData} onChange={setPatientData} />
              )
            ) : (
              <Field
                label="E-mail"
                type="email"
                autoComplete="username"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            )}

            <div className="password-field" style={{ marginTop: '12px' }}>
              <Field
                label="Senha"
                type={show ? 'text' : 'password'}
                autoComplete={register ? 'new-password' : 'current-password'}
                required
                minLength={register ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={register ? 'Mínimo 8 caracteres' : 'Digite sua senha'}
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita sua senha"
              />
            )}

            <div aria-live="polite">
              {error && (
                <p className="error-message" role="alert" style={{ marginTop: '10px' }}>
                  {error}
                </p>
              )}
              {storageError && (
                <p className="error-message" role="alert" style={{ marginTop: '10px' }}>
                  {storageError}
                </p>
              )}
            </div>

            <button
              className="button primary full-width"
              disabled={busy}
              style={{ marginTop: '15px' }}
            >
              {busy ? 'Aguarde...' : register ? 'Criar conta e continuar' : 'Entrar'}
              <Icon name="arrow" size={17} />
            </button>
          </form>

          <p className="auth-switch" style={{ marginTop: '16px' }}>
            {register ? (
              <>
                Já possui uma conta? <Link to="/">Entrar agora</Link>
              </>
            ) : (
              <>
                Ainda não tem conta?{' '}
                <Link to="/cadastro">Cadastre-se como Médico ou Paciente</Link>
              </>
            )}
          </p>

          <small className="auth-local-note" style={{ display: 'block', marginTop: '15px' }}>
            Seu cuidado, com simplicidade e segurança.
          </small>
        </section>
      </main>

      <footer>MedFlow · Cuidado mais próximo, em cada momento.</footer>
    </div>
  );
}
export { BoasVindas as Welcome };
