export const testAccounts = [
  {
    id: 'account-admin',
    role: 'clinica',
    email: 'admin@medflow.test',
    salt: '118034db-fa92-47c3-a87d-5077099af582',
    passwordHash: '6781b899ee251f447af911687892f11d96cabc5c889abcb2ae3545de7a08e48f',
  },
  {
    id: 'account-patient',
    role: 'paciente',
    patientId: 'p1',
    email: 'maria@medflow.test',
    salt: 'cf941c15-828e-40c6-a7be-ec07d593a1ad',
    passwordHash: '87e068b2e6898faf09d38dcebe8e151ae4d34d321da960713f24c03c4ae2f4e8',
  },
  {
    id: 'account-doctor-1',
    role: 'medico',
    doctorId: 'd1',
    email: 'ana@medflow.test',
    salt: '9cc7cf71-497e-48a1-a145-9fc95646921b',
    passwordHash: '4c0c98c353ab2595a0557b63eb34544f493ae549bfc11b6e699b385d6304ca93',
  },
];