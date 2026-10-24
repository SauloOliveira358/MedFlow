import { describe, it, expect } from 'vitest';
import { createMockData } from '../data/mockData';
import { testAccounts } from './fixtures/accounts';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DemoProvider } from '../context/DemoContext';
import { Prontuarios, DetalhesProntuario } from '../components/common/Prontuarios';
import ConsultasMedico from '../pages/doutor/ConsultasMedico';
import { ModalDetalhesConsulta as AppointmentDetailsModal } from '../components/common/Consulta';

describe('Funcionalidades de Prontuários na Área do Médico (MedFlow)', () => {
  const getBaseData = () => ({
    ...createMockData(),
    accounts: structuredClone(testAccounts),
  });

  it('exibe a lista de prontuários na área do médico e permite abrir o modal de novo prontuário', async () => {
    sessionStorage.setItem('medflow-session-v1', 'account-doctor-1');
    const data = getBaseData();

    render(
      <DemoProvider initialData={data}>
        <MemoryRouter initialEntries={['/medico/prontuarios']}>
          <Routes>
            <Route path="/medico/prontuarios" element={<Prontuarios area="medico" />} />
          </Routes>
        </MemoryRouter>
      </DemoProvider>,
    );

    // Deve conter título e botão de Novo prontuário
    expect(screen.getByRole('heading', { name: 'Prontuários' })).toBeInTheDocument();
    const novoBtn = screen.getByRole('button', { name: /Novo prontuário/ });
    expect(novoBtn).toBeInTheDocument();

    // Ao clicar em Novo prontuário, abre o modal
    fireEvent.click(novoBtn);
    expect(screen.getByText('Novo prontuário clínico')).toBeInTheDocument();
    expect(screen.getByText('Selecionar paciente')).toBeInTheDocument();
  });

  it('permite o médico adicionar anotações clínicas no prontuário do paciente', async () => {
    sessionStorage.setItem('medflow-session-v1', 'account-doctor-1');
    const data = getBaseData();
    const record = data.records.find((r) => r.doctorId === 'd1');

    render(
      <DemoProvider initialData={data}>
        <MemoryRouter initialEntries={[`/medico/prontuarios/${record.id}`]}>
          <Routes>
            <Route path="/medico/prontuarios/:id" element={<DetalhesProntuario area="medico" />} />
          </Routes>
        </MemoryRouter>
      </DemoProvider>,
    );

    // Acessar a aba de Anotações
    const tabAnotacoes = screen.getByRole('button', { name: 'Anotações' });
    fireEvent.click(tabAnotacoes);

    // Deve exibir o formulário de anotação
    const textarea = screen.getByPlaceholderText('Registre uma breve observação sobre o atendimento.');
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: 'Paciente relata melhora expressiva nos sintomas.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar anotação' }));

    // Deve renderizar a nova anotação na timeline
    await waitFor(() => {
      expect(screen.getByText('Paciente relata melhora expressiva nos sintomas.')).toBeInTheDocument();
    });
  });

  it('permite o médico registrar novos procedimentos na aba Procedimentos do prontuário', async () => {
    sessionStorage.setItem('medflow-session-v1', 'account-doctor-1');
    const data = getBaseData();
    const record = data.records.find((r) => r.doctorId === 'd1');

    render(
      <DemoProvider initialData={data}>
        <MemoryRouter initialEntries={[`/medico/prontuarios/${record.id}`]}>
          <Routes>
            <Route path="/medico/prontuarios/:id" element={<DetalhesProntuario area="medico" />} />
          </Routes>
        </MemoryRouter>
      </DemoProvider>,
    );

    // Mudar para a aba de Procedimentos
    const tabProc = screen.getByRole('button', { name: 'Procedimentos' });
    fireEvent.click(tabProc);

    // Deve exibir o botão de Novo procedimento
    const btnNovoProc = screen.getByRole('button', { name: /Novo procedimento/ });
    expect(btnNovoProc).toBeInTheDocument();

    fireEvent.click(btnNovoProc);

    // Preencher o formulário do procedimento
    const inputNome = screen.getByPlaceholderText(/Ex: Consulta de Avaliação, Sutura, Biópsia/);
    fireEvent.change(inputNome, { target: { value: 'Sutura de Ferimento Cutâneo' } });

    const inputObs = screen.getByPlaceholderText(/Descreva detalhes do procedimento/);
    fireEvent.change(inputObs, { target: { value: 'Realizada sutura com fio nylon 4.0, sem intercorrências.' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar procedimento' }));

    // Deve exibir o procedimento na lista
    await waitFor(() => {
      expect(screen.getByText('Sutura de Ferimento Cutâneo')).toBeInTheDocument();
      expect(screen.getByText('Realizada sutura com fio nylon 4.0, sem intercorrências.')).toBeInTheDocument();
    });
  });

  it('na tela de Agendados do médico exibe o link direto para o prontuário de cada paciente', () => {
    sessionStorage.setItem('medflow-session-v1', 'account-doctor-1');
    const data = getBaseData();

    render(
      <DemoProvider initialData={data}>
        <MemoryRouter>
          <ConsultasMedico />
        </MemoryRouter>
      </DemoProvider>,
    );

    // Deve conter botões/links para o Prontuário dos pacientes
    const prontuarioLinks = screen.getAllByRole('link', { name: /Prontuário/ });
    expect(prontuarioLinks.length).toBeGreaterThanOrEqual(1);
    expect(prontuarioLinks[0].getAttribute('href')).toContain('/medico/prontuarios?paciente=');
  });

  it('no modal de detalhes da consulta exibe o botão Ver prontuário direcionando para o prontuário', () => {
    sessionStorage.setItem('medflow-session-v1', 'account-doctor-1');
    const data = getBaseData();
    const appt = data.appointments.find((a) => a.doctorId === 'd1');

    render(
      <DemoProvider initialData={data}>
        <MemoryRouter>
          <AppointmentDetailsModal
            appointment={appt}
            area="medico"
            onClose={() => {}}
          />
        </MemoryRouter>
      </DemoProvider>,
    );

    const linkProntuario = screen.getByRole('link', { name: 'Ver prontuário' });
    expect(linkProntuario).toBeInTheDocument();
    expect(linkProntuario.getAttribute('href')).toContain('/medico/prontuarios');
  });
});
