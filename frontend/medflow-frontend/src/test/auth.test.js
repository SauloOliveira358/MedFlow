import { createMockData } from '../data/mockData';
import { testAccounts } from './fixtures/accounts';
import { doctorRegistration, patientRegistration, passwordHash } from '../utils/auth';
const base = () => ({ ...createMockData(), accounts: structuredClone(testAccounts) });
const patient = {
  name: 'Paula Teste',
  birth: '1994-01-20',
  phone: '31999990000',
  email: 'paula@example.com',
  cpf: '00000000021',
  password: 'Teste123!',
};
const doctor = {
  name: 'Dra. Clara Teste',
  specialtyId: 's1',
  registration: 'CRM 998877',
  phone: '31999990000',
  email: 'clara@example.com',
  password: 'Teste123!',
};
it('paciente se cadastra sem clínica e não escolhe perfil privilegiado', async () => {
  const result = await patientRegistration(base(), { ...patient, role: 'clinica' });
  expect(result.account.role).toBe('paciente');
  expect(result.account.patientId).toBe(result.patient.id);
  expect(result.account.password).toBeUndefined();
  expect(result.patient.password).toBeUndefined();
  expect(result.account.passwordHash).toBe(
    await passwordHash(patient.password, result.account.salt),
  );
});
it('apenas administrador cria conta médica', async () => {
  const data = base();
  for (const role of ['paciente', 'medico'])
    await expect(doctorRegistration(data, { role }, doctor)).rejects.toThrow('permissão');
  await expect(doctorRegistration(data, null, doctor)).rejects.toThrow('permissão');
  const result = await doctorRegistration(data, data.accounts[0], doctor);
  expect(result.account.role).toBe('medico');
  expect(result.account.doctorId).toBe(result.doctor.id);
  expect(result.doctor.password).toBeUndefined();
});
it('rejeita e-mail duplicado sem diferenciar maiúsculas e espaços', async () => {
  await expect(
    patientRegistration(base(), { ...patient, email: ' MARIA@medflow.test ' }),
  ).rejects.toThrow('e-mail');
  await expect(
    doctorRegistration(base(), testAccounts[0], { ...doctor, email: 'admin@medflow.test' }),
  ).rejects.toThrow('conta');
});
it('rejeita senha curta e registro profissional repetido', async () => {
  await expect(patientRegistration(base(), { ...patient, password: '123' })).rejects.toThrow(
    '8 caracteres',
  );
  await expect(
    doctorRegistration(base(), testAccounts[0], { ...doctor, registration: 'CRM 123456' }),
  ).rejects.toThrow('registro');
});
it('credenciais válidas produzem o hash esperado e senha errada é diferente', async () => {
  expect(await passwordHash('MedFlow123!', testAccounts[0].salt)).toBe(
    testAccounts[0].passwordHash,
  );
  expect(await passwordHash('incorreta', testAccounts[0].salt)).not.toBe(
    testAccounts[0].passwordHash,
  );
});
