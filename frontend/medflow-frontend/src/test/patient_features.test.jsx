import { describe, it, expect } from 'vitest';
import { createMockData } from '../data/mockData';
import { testAccounts } from './fixtures/accounts';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DemoProvider } from '../context/DemoContext';
import { ModalDetalhesConsulta as AppointmentDetailsModal } from '../components/common/Consulta';
import Booking from '../pages/paciente/AgendamentoConsulta';
import { ConsultasPaciente as PatientAppointments } from '../pages/paciente/PaginasPaciente';
import { SeletorHorario } from '../components/common/SeletorData';
import { today, addDays } from '../utils/date';

describe('Correções da Área do Paciente (MedFlow)', () => {
  const getBaseData = () => ({
    ...createMockData(),
    accounts: structuredClone(testAccounts),
  });

  it('exibe o botão Reagendar para o paciente no modal de detalhes quando o status é Confirmado ou Pendente', () => {
    const data = getBaseData();
    const appt = data.appointments.find((a) => a.status === 'Confirmado');

    render(
      <DemoProvider initialData={data}>
        <MemoryRouter>
          <AppointmentDetailsModal
            appointment={appt}
            area="paciente"
            onClose={() => {}}
          />
        </MemoryRouter>
      </DemoProvider>,
    );

    // O paciente agora possui o botão Reagendar disponível no modal de detalhes
    const rescheduleLink = screen.getByRole('link', { name: 'Reagendar' });
    expect(rescheduleLink).toBeInTheDocument();
    expect(rescheduleLink.getAttribute('href')).toContain(`/paciente/agendar?reagendar=${appt.id}`);
  });

  it('não exibe botão Reagendar para consultas Canceladas no modal de detalhes', () => {
    const data = getBaseData();
    const appt = { ...data.appointments[0], status: 'Cancelado' };

    render(
      <DemoProvider initialData={data}>
        <MemoryRouter>
          <AppointmentDetailsModal
            appointment={appt}
            area="paciente"
            onClose={() => {}}
          />
        </MemoryRouter>
      </DemoProvider>,
    );

    expect(screen.queryByRole('link', { name: 'Reagendar' })).not.toBeInTheDocument();
  });

  it('no reagendamento carrega o profissional e especialidade e pula direto para o passo de data e horário', async () => {
    const data = getBaseData();
    const appt = data.appointments[0];
    sessionStorage.setItem('medflow-session-v1', 'account-patient');

    render(
      <DemoProvider initialData={data}>
        <MemoryRouter initialEntries={[`/paciente/agendar?reagendar=${appt.id}`]}>
          <Routes>
            <Route path="/paciente/agendar" element={<Booking area="paciente" />} />
          </Routes>
        </MemoryRouter>
      </DemoProvider>,
    );

    // Deve pular para o Passo 3 de 5 (index 2: Data e horário)
    await waitFor(() => {
      expect(screen.getByText('Um tempo para cuidar de você')).toBeInTheDocument();
    });

    // Deve exibir o resumo do profissional com botão para alterar se quiser
    expect(screen.getByRole('button', { name: 'Alterar profissional' })).toBeInTheDocument();
  });

  it('exibe a legenda correta de horários disponibilizados pelo profissional no SeletorHorario', () => {
    const data = getBaseData();
    const doctor = data.doctors[0];
    const testDate = addDays(today(), 1);

    render(
      <DemoProvider initialData={data}>
        <MemoryRouter>
          <SeletorHorario
            doctorId={doctor.id}
            date={testDate}
            value=""
            onChange={() => {}}
          />
        </MemoryRouter>
      </DemoProvider>,
    );

    expect(
      screen.getByText('Horários disponibilizados diretamente pelo profissional.'),
    ).toBeInTheDocument();
  });

  it('limpa mensagens de erro ao interagir com as etapas do wizard', async () => {
    const data = getBaseData();
    sessionStorage.setItem('medflow-session-v1', 'account-patient');

    render(
      <DemoProvider initialData={data}>
        <MemoryRouter initialEntries={['/paciente/agendar']}>
          <Routes>
            <Route path="/paciente/agendar" element={<Booking area="paciente" />} />
          </Routes>
        </MemoryRouter>
      </DemoProvider>,
    );

    // No passo 0, clicar em Continuar sem selecionar especialidade
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha uma especialidade.');

    // Ao selecionar uma especialidade, o erro deve sumir
    const firstSpecialty = screen.getByRole('button', { name: /Dermatologia/ });
    fireEvent.click(firstSpecialty);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
