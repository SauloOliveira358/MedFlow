import { Suspense, lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import LayoutArea from './layouts/LayoutArea';
import BoasVindas from './pages/BoasVindas';
import RequerConta from './components/common/RequerConta';
import { EsqueletoCarregamento, EstadoVazio } from './components/common/InterfaceUI';
import { PainelPaciente, ConsultasPaciente } from './pages/patient/PaginasPaciente';
import PainelMedico from './pages/doctor/PainelMedico';
import PainelClinica from './pages/clinic/PainelClinica';
import { Notificacoes, Perfil, Configuracoes } from './pages/PaginasCompartilhadas';
import { Profissionais, Especialidades, Relatorios } from './pages/clinic/PaginasClinica';

const AgendamentoConsulta = lazy(() => import('./pages/patient/AgendamentoConsulta'));
const Agenda = lazy(() => import('./components/common/Agenda'));
const Pacientes = lazy(() => import('./components/common/Pacientes'));
const Prontuarios = lazy(() =>
  import('./components/common/Prontuarios').then((m) => ({ default: m.Prontuarios })),
);
const DetalhesProntuario = lazy(() =>
  import('./components/common/Prontuarios').then((m) => ({ default: m.DetalhesProntuario })),
);
const ConsultasMedico = lazy(() => import('./pages/doctor/ConsultasMedico'));
const GerenciadorAgendaMedico = lazy(() => import('./components/doctor/GerenciadorAgendaMedico'));

export default function App() {
  return (
    <Suspense fallback={<EsqueletoCarregamento />}>
      <Routes>
        <Route path="/" element={<BoasVindas key="login" />} />
        <Route path="/cadastro" element={<BoasVindas key="register" register />} />
        <Route
          path="/paciente"
          element={
            <RequerConta area="paciente">
              <LayoutArea area="paciente" />
            </RequerConta>
          }
        >
          <Route index element={<PainelPaciente />} />
          <Route path="agendar" element={<AgendamentoConsulta key="paciente" />} />
          <Route path="agendamentos" element={<ConsultasPaciente key="upcoming" />} />
          <Route path="historico" element={<ConsultasPaciente key="history" history />} />
          <Route path="notificacoes" element={<Notificacoes area="paciente" />} />
          <Route path="perfil" element={<Perfil area="paciente" />} />
        </Route>
        {['medico', 'clinica'].map((area) => (
          <Route
            key={area}
            path={`/${area}`}
            element={
              <RequerConta area={area}>
                <LayoutArea area={area} />
              </RequerConta>
            }
          >
            <Route index element={area === 'medico' ? <PainelMedico /> : <PainelClinica />} />
            <Route path="agenda" element={<Agenda key={area + 'agenda'} area={area} />} />
            <Route path="agendar" element={<AgendamentoConsulta key={area} area={area} />} />
            <Route
              path="agendamentos"
              element={<Agenda key={area + 'appointments'} area={area} appointmentsPage />}
            />
            <Route path="pacientes" element={<Pacientes area={area} />} />
            <Route path="prontuarios" element={<Prontuarios key={area + 'records'} area={area} />} />
            <Route path="prontuarios/:id" element={<DetalhesProntuario area={area} />} />
            {area === 'medico' ? (
              <>
                <Route path="horarios" element={<GerenciadorAgendaMedico />} />
                <Route path="agendados" element={<ConsultasMedico />} />
                <Route
                  path="atendimentos"
                  element={<Navigate to={`/${area}/agenda`} replace />}
                />
                <Route path="notificacoes" element={<Notificacoes area={area} />} />
                <Route path="perfil" element={<Perfil area={area} />} />
              </>
            ) : (
              <>
                <Route path="profissionais" element={<Profissionais />} />
                <Route path="especialidades" element={<Especialidades />} />
                <Route path="relatorios" element={<Relatorios />} />
                <Route path="configuracoes" element={<Configuracoes />} />
              </>
            )}
          </Route>
        ))}
        <Route
          path="*"
          element={
            <EstadoVazio
              title="Esse caminho não foi encontrado"
              description="Vamos voltar ao seu espaço de cuidado?"
              to="/"
              action="Voltar ao início"
            />
          }
        />
      </Routes>
    </Suspense>
  );
}
