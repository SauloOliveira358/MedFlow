import { describe, it, expect } from 'vitest';
import { createMockData } from '../data/mockData';
import { demoAccounts } from '../data/demoAccounts';
import { doctorSelfRegistration } from '../utils/auth';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DemoProvider } from '../context/DemoContext';
import { ModalDetalhesConsulta as AppointmentDetailsModal } from '../components/common/Consulta';
import Booking from '../pages/paciente/AgendamentoConsulta';
import { ConsultasPaciente as PatientAppointments } from '../pages/paciente/PaginasPaciente';
import { Perfil as Profile, Configuracoes as Settings } from '../pages/PaginasCompartilhadas';
import LocationMap from '../components/common/MapaLocalizacao';
import DoctorForm from '../components/common/FormularioMedico';
import {
  changeAppointmentStatus,
  getDoctorSlotsForDate,
  slotUnavailable,
  bookAppointment,
} from '../utils/appointments';
import { today, addDays } from '../utils/date';

describe('Funcionalidades do Médico e Paciente (MedFlow)', () => {
  const getBaseData = () => ({
    ...createMockData(),
    accounts: structuredClone(demoAccounts),
  });

  it('permite o médico criar conta própria informando CRM e especialidade', async () => {
    const data = getBaseData();
    const form = {
      name: 'Dr. Roberto Mendes',
      registration: 'CRM 887766/MG',
      specialtyId: 's1', // Dermatologia
      phone: '31988887777',
      email: 'roberto@medflow.teste',
      password: 'SenhaForte123!',
    };

    const result = await doctorSelfRegistration(data, form);
    expect(result.account.role).toBe('medico');
    expect(result.account.doctorId).toBe(result.doctor.id);
    expect(result.doctor.name).toBe('Dr. Roberto Mendes');
    expect(result.doctor.registration).toBe('CRM 887766/MG');
    expect(result.doctor.specialtyId).toBe('s1');
  });

  it('permite o médico criar conta com especialidade personalizada', async () => {
    const data = getBaseData();
    const form = {
      name: 'Dra. Gabriela Oftalmo',
      registration: 'CRM 991122/SP',
      specialtyName: 'Oftalmologia',
      phone: '11977776666',
      email: 'gabriela@medflow.teste',
      password: 'SenhaForte123!',
    };

    const result = await doctorSelfRegistration(data, form);
    expect(result.newSpecialty).toBeDefined();
    expect(result.newSpecialty.name).toBe('Oftalmologia');
    expect(result.doctor.specialtyId).toBe(result.newSpecialty.id);
  });

  it('permite o médico marcar Compareceu, Não compareceu ou Cancelar agendamento', () => {
    const data = getBaseData();
    const appointment = data.appointments[0];

    // Marcar como Compareceu
    const attended = changeAppointmentStatus(data, appointment.id, 'Compareceu');
    expect(attended.appointments.find((a) => a.id === appointment.id).status).toBe('Compareceu');

    // Alternar para Não compareceu (caso precise corrigir)
    const noShow = changeAppointmentStatus(attended, appointment.id, 'Não compareceu');
    expect(noShow.appointments.find((a) => a.id === appointment.id).status).toBe('Não compareceu');

    // Cancelar agendamento
    const cancelled = changeAppointmentStatus(noShow, appointment.id, 'Cancelado');
    expect(cancelled.appointments.find((a) => a.id === appointment.id).status).toBe('Cancelado');
  });

  it('gerencia horários da agenda e replica horários de um dia para outro', () => {
    const data = getBaseData();
    const doctorId = 'd1';
    const day1 = today();
    const day2 = addDays(today(), 1);

    // Configurar slots customizados para o dia 1
    const customSlotsDay1 = ['08:00', '09:00', '10:00', '15:00'];
    data.doctorSchedules = [
      {
        id: 'sch-1',
        doctorId,
        date: day1,
        slots: customSlotsDay1,
      },
    ];

    expect(getDoctorSlotsForDate(data, doctorId, day1)).toEqual(customSlotsDay1);

    // Replicar os horários do dia 1 para o dia 2
    data.doctorSchedules.push({
      id: 'sch-2',
      doctorId,
      date: day2,
      slots: [...customSlotsDay1],
    });

    // Verificar se o dia 2 agora possui exatamente os mesmos horários replicados
    expect(getDoctorSlotsForDate(data, doctorId, day2)).toEqual(customSlotsDay1);

    // Verificar disponibilidade de slot liberado vs não liberado
    expect(slotUnavailable(data, doctorId, day2, '15:00')).toBe(false); // liberado
    expect(slotUnavailable(data, doctorId, day2, '11:00')).toBe(true);  // não liberado
  });

  it('inicia novos agendamentos como Pendente e permite transição para Compareceu, Não compareceu e Cancelado', () => {
    const data = getBaseData();
    const input = {
      patient: data.patients[0],
      doctorId: 'd1',
      date: addDays(today(), 5),
      time: '14:00',
      reason: 'Paciente ligou para marcar consulta',
    };

    const booked = bookAppointment(data, input);
    expect(booked.appointment.status).toBe('Pendente');

    // Transição de Pendente para Compareceu
    const attended = changeAppointmentStatus(booked.data, booked.appointment.id, 'Compareceu');
    expect(attended.appointments.find((a) => a.id === booked.appointment.id).status).toBe('Compareceu');

    // Transição de Compareceu para Não compareceu
    const noShow = changeAppointmentStatus(attended, booked.appointment.id, 'Não compareceu');
    expect(noShow.appointments.find((a) => a.id === booked.appointment.id).status).toBe('Não compareceu');

    // Transição de Não compareceu para Cancelado
    const cancelled = changeAppointmentStatus(noShow, booked.appointment.id, 'Cancelado');
    expect(cancelled.appointments.find((a) => a.id === booked.appointment.id).status).toBe('Cancelado');
  });

  it('no modal de agendamento do médico não exibe Iniciar atendimento, Concluir atendimento nem Reagendar', () => {
    const data = getBaseData();
    const appointment = data.appointments[0];

    render(
      <DemoProvider>
        <MemoryRouter>
          <AppointmentDetailsModal
            appointment={appointment}
            data={data}
            onClose={() => {}}
            onStatus={() => {}}
            area="medico"
          />
        </MemoryRouter>
      </DemoProvider>,
    );

    // Não deve conter Iniciar atendimento, Concluir atendimento nem Reagendar
    expect(screen.queryByText('Iniciar atendimento')).not.toBeInTheDocument();
    expect(screen.queryByText('Concluir atendimento')).not.toBeInTheDocument();
    expect(screen.queryByText('Reagendar')).not.toBeInTheDocument();

    // Deve conter Compareceu, Não compareceu, Cancelar e Fechar
    expect(screen.getByRole('button', { name: /Compareceu/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Não compareceu/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancelar/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Fechar' }).length).toBeGreaterThanOrEqual(1);
  });

  it('na tela de nova consulta do médico exibe seleção direta de paciente, data e horário', () => {
    render(
      <DemoProvider>
        <MemoryRouter>
          <Booking area="medico" />
        </MemoryRouter>
      </DemoProvider>,
    );

    // Deve exibir o cabeçalho de Nova consulta e identificação direta
    expect(screen.getByRole('heading', { name: 'Nova consulta' })).toBeInTheDocument();
    expect(screen.getByText('Paciente já cadastrado')).toBeInTheDocument();
    expect(screen.getByText('Cadastrar novo paciente')).toBeInTheDocument();

    // Deve conter seletor de data e horário
    expect(screen.getByText('Selecione a data e o horário')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar agendamento' })).toBeInTheDocument();

    // NÃO deve exibir seleção de especialidades do fluxo de paciente
    expect(screen.queryByPlaceholderText('Qual especialista você procura?')).not.toBeInTheDocument();
    expect(screen.queryByText('Encontre seu profissional')).not.toBeInTheDocument();
  });

  it('em agendamentos do paciente não exibe reagendar (somente cancelar) e no histórico exibe em linha/tabela com detalhes', () => {
    sessionStorage.setItem('medflow-session-v1', 'account-patient');
    render(
      <DemoProvider>
        <MemoryRouter>
          <PatientAppointments />
        </MemoryRouter>
      </DemoProvider>,
    );

    // Em Próximos: não deve conter o botão/link Reagendar
    expect(screen.queryByText('Reagendar')).not.toBeInTheDocument();

    // Mudar para a aba de Histórico
    const historicoTab = screen.getByRole('button', { name: 'Histórico' });
    fireEvent.click(historicoTab);

    // No Histórico: deve exibir tabela com colunas e linhas
    expect(screen.getByText('Data e horário')).toBeInTheDocument();
    expect(screen.getByText('Profissional')).toBeInTheDocument();
    expect(screen.getByText('Especialidade')).toBeInTheDocument();

    // Deve conter botões de Ver detalhes nas linhas
    const detailButtons = screen.getAllByRole('button', { name: /Ver detalhes/ });
    expect(detailButtons.length).toBeGreaterThanOrEqual(1);

    // Ao clicar em Ver detalhes, abre os detalhes da consulta
    fireEvent.click(detailButtons[0]);
    expect(screen.getByRole('heading', { name: 'Detalhes da consulta' })).toBeInTheDocument();
  });

  it('permite upload de foto no perfil do usuário e no perfil da empresa/clínica', () => {
    // 1. Perfil do usuário (paciente)
    sessionStorage.setItem('medflow-session-v1', 'account-patient');
    const { unmount } = render(
      <DemoProvider>
        <MemoryRouter>
          <Profile area="paciente" />
        </MemoryRouter>
      </DemoProvider>,
    );

    expect(screen.getByRole('button', { name: 'Carregar foto de perfil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alterar foto' })).toBeInTheDocument();
    unmount();

    // 2. Perfil da empresa (clínica)
    sessionStorage.setItem('medflow-session-v1', 'account-admin');
    render(
      <DemoProvider>
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
      </DemoProvider>,
    );

    expect(screen.getByRole('button', { name: 'Carregar logo ou foto da empresa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar foto da empresa' })).toBeInTheDocument();
  });

  it('exibe o mapa com o local da consulta no modal de detalhes e link para o Google Maps', () => {
    const data = getBaseData();
    const appt = data.appointments[0];

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

    // Deve conter a seção do mapa oficial do Google Maps
    expect(screen.getByText('Local da Consulta no Maps')).toBeInTheDocument();
    expect(screen.getByText('Localização no Google Maps')).toBeInTheDocument();

    // Deve conter o mapa interativo renderizado
    const mapEl = screen.getByLabelText('Mapa da consulta');
    expect(mapEl).toBeInTheDocument();

    // Deve conter link para Abrir no Google Maps
    const gmapsLink = screen.getByTitle('Abrir no Google Maps');
    expect(gmapsLink).toBeInTheDocument();
    expect(gmapsLink.getAttribute('href')).toContain('google.com/maps/search');

    // Não deve conter botão de Como Chegar (conforme solicitado)
    expect(screen.queryByTitle('Traçar rota até o consultório')).toBeNull();
  });

  it('não exibe mapa para o médico na sua agenda ou detalhes da consulta', () => {
    const data = getBaseData();
    const appt = data.appointments[0];

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

    // Para o médico, não deve renderizar o mapa do local da consulta
    expect(screen.queryByText('Local da Consulta no Maps')).toBeNull();
    expect(screen.queryByLabelText('Mapa da consulta')).toBeNull();
  });

  it('permite marcar o ponto no mapa e definir o endereço do estabelecimento ao criar conta do médico', async () => {
    const data = getBaseData();
    const form = {
      name: 'Dr. Lucas Oftalmologista',
      registration: 'CRM 554433/MG',
      specialtyId: 's1',
      phone: '31988889999',
      email: 'lucas.oftalmo@medflow.teste',
      password: 'SenhaForte123!',
      clinic: 'Centro Oftalmológico Olhar',
      address: 'Av. do Contorno, 4000, Sala 801 - Funcionários',
      city: 'Belo Horizonte, MG',
      lat: -19.9325,
      lng: -43.9388,
    };

    const result = await doctorSelfRegistration(data, form);
    expect(result.doctor.clinic).toBe('Centro Oftalmológico Olhar');
    expect(result.doctor.address).toBe('Av. do Contorno, 4000, Sala 801 - Funcionários');
    expect(result.doctor.lat).toBe(-19.9325);
    expect(result.doctor.lng).toBe(-43.9388);
  });

  it('permite interagir com o componente LocationMap com busca de endereço e atualizar coordenadas', () => {
    let updatedCoords = null;
    const { getByRole, getByLabelText } = render(
      <LocationMap
        lat={-19.9227}
        lng={-43.9451}
        clinicName="Clínica Exemplo"
        address="Rua Exemplo, 123"
        editable={true}
        onChange={(coords) => {
          updatedCoords = coords;
        }}
      />,
    );

    // Em modo editável, deve exibir a barra de pesquisa do mapa e botão de GPS
    expect(screen.getByText(/Pesquisa e Ponto no Mapa/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Buscar no Maps/ })).toBeInTheDocument();

    // Simula clique na área do mapa para marcar o ponto
    const mapRegion = getByRole('button', { name: /Clique no mapa para posicionar o marcador/ });
    fireEvent.click(mapRegion, { clientX: 100, clientY: 100 });

    expect(updatedCoords).not.toBeNull();
    expect(typeof updatedCoords.lat).toBe('number');
    expect(typeof updatedCoords.lng).toBe('number');

    // Simula pesquisa de coordenadas no campo de busca do mapa
    const searchInput = getByLabelText('Pesquisar endereço no mapa');
    fireEvent.change(searchInput, { target: { value: '-23.5505, -46.6333' } });
    fireEvent.click(screen.getByRole('button', { name: /Buscar no Maps/ }));

    expect(updatedCoords.lat).toBe(-23.5505);
    expect(updatedCoords.lng).toBe(-46.6333);
  });

  it('no formulário de cadastro do médico exibe campos obrigatórios de Latitude e Longitude e não exibe cidade', () => {
    const value = {
      name: 'Dra. Luiza',
      registration: 'CRM 1234',
      phone: '11999998888',
      specialtyId: 's1',
      email: 'luiza@exemplo.com',
      clinic: 'Consultório Luiza',
      address: 'Rua Bela Cintra, 500',
      lat: -23.5505,
      lng: -46.6333,
    };

    render(
      <DemoProvider>
        <DoctorForm value={value} onChange={() => {}} />
      </DemoProvider>,
    );

    // Latitude e Longitude devem estar presentes e marcados com * (obrigatório)
    const latInput = screen.getByLabelText(/Latitude \*/);
    const lngInput = screen.getByLabelText(/Longitude \*/);
    expect(latInput).toBeInTheDocument();
    expect(latInput).toBeRequired();
    expect(lngInput).toBeInTheDocument();
    expect(lngInput).toBeRequired();

    // Cidade não deve mais estar presente
    expect(screen.queryByLabelText(/Cidade e Estado/)).toBeNull();
  });
});

