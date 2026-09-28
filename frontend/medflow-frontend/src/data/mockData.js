import { addDays, today } from '../utils/date';
export const specialties = [
  {
    id: 's1',
    name: 'Dermatologia',
    description: 'Cuidado e saúde para a sua pele.',
    icon: 'sparkles',
    color: 'rose',
  },
  {
    id: 's2',
    name: 'Estética',
    description: 'Bem-estar que valoriza você.',
    icon: 'flower',
    color: 'peach',
  },
  {
    id: 's3',
    name: 'Nutrição',
    description: 'Mais equilíbrio em cada escolha.',
    icon: 'apple',
    color: 'sage',
  },
  {
    id: 's4',
    name: 'Fisioterapia',
    description: 'Movimento e qualidade de vida.',
    icon: 'activity',
    color: 'blue',
  },
  {
    id: 's5',
    name: 'Psicologia',
    description: 'Um espaço para se ouvir.',
    icon: 'brain',
    color: 'lavender',
  },
  {
    id: 's6',
    name: 'Biomedicina Estética',
    description: 'Ciência e cuidado em harmonia.',
    icon: 'flask',
    color: 'rose',
  },
  {
    id: 's7',
    name: 'Enfermagem',
    description: 'Acolhimento em cada etapa.',
    icon: 'heart',
    color: 'peach',
  },
  {
    id: 's8',
    name: 'Clínica Geral',
    description: 'Um olhar completo para você.',
    icon: 'stethoscope',
    color: 'sage',
  },
];
export const doctors = [
  {
    id: 'd1',
    name: 'Dra. Ana Silva',
    firstName: 'Dra. Ana',
    specialtyId: 's1',
    rating: '4,9',
    registration: 'CRM 123456',
    photo: '/portraits/ana.svg',
  },
  {
    id: 'd2',
    name: 'Dra. Beatriz Lima',
    firstName: 'Dra. Beatriz',
    specialtyId: 's2',
    rating: '4,8',
    registration: 'CRM 123457',
    photo: '/portraits/beatriz.svg',
  },
  {
    id: 'd3',
    name: 'Dr. Carlos Souza',
    firstName: 'Dr. Carlos',
    specialtyId: 's3',
    rating: '4,9',
    registration: 'CRN 12345',
    photo: '/portraits/carlos.svg',
  },
  {
    id: 'd4',
    name: 'Dr. Felipe Santos',
    firstName: 'Dr. Felipe',
    specialtyId: 's4',
    rating: '4,9',
    registration: 'CREFITO 23456',
    photo: '/portraits/felipe.svg',
  },
  {
    id: 'd5',
    name: 'Dra. Luiza Costa',
    firstName: 'Dra. Luiza',
    specialtyId: 's5',
    rating: '5,0',
    registration: 'CRP 34567',
    photo: '/portraits/luiza.svg',
  },
  {
    id: 'd6',
    name: 'Dra. Camila Rocha',
    firstName: 'Dra. Camila',
    specialtyId: 's6',
    rating: '4,8',
    registration: 'CRBM 45678',
    photo: '/portraits/camila.svg',
  },
  {
    id: 'd7',
    name: 'Enf. Renata Alves',
    firstName: 'Enf. Renata',
    specialtyId: 's7',
    rating: '4,9',
    registration: 'COREN 56789',
    photo: '/portraits/renata.svg',
  },
  {
    id: 'd8',
    name: 'Dr. Bruno Ribeiro',
    firstName: 'Dr. Bruno',
    specialtyId: 's8',
    rating: '4,9',
    registration: 'CRM 123458',
    photo: '/portraits/bruno.svg',
  },
].map((d) => ({
  ...d,
  clinic: 'Clínica Saúde & Estética',
  address: 'Rua das Flores, 120 · Funcionários, Belo Horizonte - MG',
  city: 'Belo Horizonte, MG',
  lat: -19.9227,
  lng: -43.9451,
  start: '08:00',
  end: '18:00',
  email: `${d.id}@medflow.example`,
  phone: '(31) 99999-0000',
  bio: 'Um atendimento acolhedor, com tempo para ouvir você.',
}));
export function createMockData() {
  const names = [
    'Maria Oliveira',
    'Fernanda Souza',
    'Juliana Lima',
    'Pedro Almeida',
    'Lucas Ferreira',
    'Mariana Costa',
    'Rafael Dias',
    'Isabela Martins',
    'Gabriel Rocha',
    'Carolina Mendes',
  ];
  const patients = names.map((name, i) => ({
    id: `p${i + 1}`,
    name,
    birth: `${1994 - i}-05-12`,
    phone: `(31) 99999-${String(i + 1).padStart(4, '0')}`,
    email: `paciente${i + 1}@example.com`,
    cpf: `000000000${String(i + 1).padStart(2, '0')}`,
    photo: i === 0 ? '/portraits/maria.svg' : '',
  }));
  const appointments = Array.from({ length: 20 }, (_, i) => ({
    id: `a${i + 1}`,
    patientId: `p${(i % 10) + 1}`,
    doctorId: `d${(i % 8) + 1}`,
    date: addDays(today(), i < 8 ? 0 : i < 14 ? 1 : i < 17 ? i - 12 : -(i - 16)),
    time: ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00'][i % 8],
    status:
      i === 6
        ? 'Em atendimento'
        : i === 19
          ? 'Cancelado'
          : i >= 17
            ? 'Concluído'
            : i % 5 === 1
              ? 'Pendente'
              : 'Confirmado',
    reason: i === 0 ? 'Gostaria de avaliar manchas no rosto.' : 'Consulta de acompanhamento.',
    type: i % 3 === 0 ? 'Primeira consulta' : 'Retorno',
    createdAt: new Date().toISOString(),
  }));
  const records = patients.map((p, i) => ({
    id: `r${i + 1}`,
    patientId: p.id,
    doctorId: `d${(i % 8) + 1}`,
    updatedAt: new Date().toISOString(),
    summary: 'Paciente em acompanhamento.',
    notes: [
      {
        id: `n${i}`,
        text: 'Primeiro contato realizado. Orientações gerais registradas.',
        date: addDays(today(), -15),
        author: doctors[i % 8].name,
      },
    ],
    procedures: [{ name: 'Avaliação inicial', date: addDays(today(), -15) }],
    documents: [
      {
        id: 'doc1',
        name: 'Resumo do atendimento',
        text: 'MedFlow — resumo do atendimento.',
      },
    ],
  }));
  const standardSlots = [
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
  ];
  const doctorSchedules = [];
  for (const doc of doctors) {
    for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
      doctorSchedules.push({
        id: `ds-${doc.id}-${addDays(today(), dayOffset)}`,
        doctorId: doc.id,
        date: addDays(today(), dayOffset),
        slots: [...standardSlots],
        updatedAt: new Date().toISOString(),
      });
    }
  }
  return {
    version: 2,
    patients,
    doctors,
    specialties,
    appointments,
    records,
    doctorSchedules,
    notifications: [
      {
        id: 'welcome',
        patientId: 'p1',
        doctorId: 'd1',
        title: 'Seu cuidado, mais perto',
        message: 'Sua próxima consulta e todas as informações estão por aqui.',
        at: new Date().toISOString(),
        readBy: [],
      },
    ],
    clinic: {
      name: 'Clínica Saúde & Estética',
      phone: '(31) 3333-0000',
      email: 'contato@clinica.example',
      address: 'Rua das Flores, 120 · Funcionários, Belo Horizonte - MG',
      lat: -19.9227,
      lng: -43.9451,
    },
  };
}
