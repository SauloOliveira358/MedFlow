import { Suspense, lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import AreaLayout from './layouts/AreaLayout';
import Welcome from './pages/Welcome';
import RequireAccount from './components/common/RequireAccount';
import { LoadingSkeleton, EmptyState } from './components/common/UI';
import { PatientDashboard, PatientAppointments } from './pages/patient/PatientPages';
import DoctorDashboard from './pages/doctor/Dashboard';
import ClinicDashboard from './pages/clinic/Dashboard';
import { Notifications, Profile, Settings } from './pages/SharedPages';
import { Professionals, Specialties, Reports } from './pages/clinic/ClinicPages';
const Booking = lazy(() => import('./pages/patient/Booking'));
const Schedule = lazy(() => import('./components/common/Schedule'));
const Patients = lazy(() => import('./components/common/Patients'));
const Records = lazy(() =>
  import('./components/common/Records').then((m) => ({ default: m.Records })),
);
const RecordDetail = lazy(() =>
  import('./components/common/Records').then((m) => ({ default: m.RecordDetail })),
);
const DoctorAppointments = lazy(() => import('./pages/doctor/DoctorAppointments'));
const DoctorScheduleManager = lazy(() => import('./components/doctor/DoctorScheduleManager'));
export default function App() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <Routes>
        <Route path="/" element={<Welcome key="login" />} />
        <Route path="/cadastro" element={<Welcome key="register" register />} />
        <Route
          path="/paciente"
          element={
            <RequireAccount area="paciente">
              <AreaLayout area="paciente" />
            </RequireAccount>
          }
        >
          <Route index element={<PatientDashboard />} />
          <Route path="agendar" element={<Booking key="paciente" />} />
          <Route path="agendamentos" element={<PatientAppointments key="upcoming" />} />
          <Route path="historico" element={<PatientAppointments key="history" history />} />
          <Route path="notificacoes" element={<Notifications area="paciente" />} />
          <Route path="perfil" element={<Profile area="paciente" />} />
        </Route>
        {['medico', 'clinica'].map((area) => (
          <Route
            key={area}
            path={`/${area}`}
            element={
              <RequireAccount area={area}>
                <AreaLayout area={area} />
              </RequireAccount>
            }
          >
            <Route index element={area === 'medico' ? <DoctorDashboard /> : <ClinicDashboard />} />
            <Route path="agenda" element={<Schedule key={area + 'agenda'} area={area} />} />
            <Route path="agendar" element={<Booking key={area} area={area} />} />
            <Route
              path="agendamentos"
              element={<Schedule key={area + 'appointments'} area={area} appointmentsPage />}
            />
            <Route path="pacientes" element={<Patients area={area} />} />
            <Route path="prontuarios" element={<Records key={area + 'records'} area={area} />} />
            <Route path="prontuarios/:id" element={<RecordDetail area={area} />} />
            {area === 'medico' ? (
              <>
                <Route path="horarios" element={<DoctorScheduleManager />} />
                <Route path="agendados" element={<DoctorAppointments />} />
                <Route
                  path="atendimentos"
                  element={<Navigate to={`/${area}/agenda`} replace />}
                />
                <Route path="notificacoes" element={<Notifications area={area} />} />
                <Route path="perfil" element={<Profile area={area} />} />
              </>
            ) : (
              <>
                <Route path="profissionais" element={<Professionals />} />
                <Route path="especialidades" element={<Specialties />} />
                <Route path="relatorios" element={<Reports />} />
                <Route path="configuracoes" element={<Settings />} />
              </>
            )}
          </Route>
        ))}
        <Route
          path="*"
          element={
            <EmptyState
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
