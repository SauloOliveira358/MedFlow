import { test, expect } from '@playwright/test';

const emails = {
  paciente: 'maria@medflow.demo',
  medico: 'ana@medflow.demo',
  clinica: 'admin@medflow.demo',
  outro: 'medico2@medflow.demo',
};
async function login(page, role) {
  const exit = page.getByRole('button', { name: 'Sair', exact: true });
  if (await exit.isVisible()) await exit.click();
  else await page.goto('/');
  await page.getByLabel('E-mail', { exact: true }).fill(emails[role]);
  await page.getByLabel('Senha', { exact: true }).fill('MedFlow123!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(new RegExp('/' + (role === 'outro' ? 'medico' : role) + '(?:/|$)'));
}

const dateAfter = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
test('paciente agenda, médico visualiza e clínica cancela a mesma consulta', async ({ page }) => {
  await login(page, 'paciente');
  await page.goto('/paciente/agendar');
  await page.getByRole('button', { name: 'Dermatologia Cuidado e saúde para a sua pele.' }).click();
  await page.getByRole('button', { name: 'Selecionar profissional' }).click();
  await page.getByLabel('Abrir calendário completo').fill(dateAfter(3));
  await page.getByRole('button', { name: '16:00', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page
    .getByLabel('Deseja informar algo ao profissional?')
    .fill('Demonstração de sincronização entre as três áreas.');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar agendamento', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Consulta agendada com sucesso!' })).toBeVisible();
  await page.getByRole('link', { name: 'Ver meus agendamentos', exact: true }).click();
  await expect(page.getByText('· 16:00', { exact: true })).toBeVisible();
  await login(page, 'medico');
  await page.getByRole('link', { name: 'Minha agenda', exact: true }).click();
  await page.getByLabel('Data', { exact: true }).fill(dateAfter(3));
  await expect(page.getByRole('button', { name: /16:00.*Maria Oliveira/ })).toBeVisible();
  await login(page, 'outro');
  await page.goto('/medico/agenda');
  await page.getByLabel('Data', { exact: true }).fill(dateAfter(3));
  await expect(page.getByRole('button', { name: /16:00.*Maria Oliveira/ })).toHaveCount(0);
  await login(page, 'clinica');
  await page.getByRole('link', { name: 'Agenda geral', exact: true }).click();
  await page.getByLabel('Data', { exact: true }).fill(dateAfter(3));
  await page.getByRole('button', { name: /16:00.*Maria Oliveira.*Dra. Ana Silva/ }).click();
  await expect(page.getByText('Demonstração de sincronização entre as três áreas.')).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar cancelamento', exact: true }).click();
  await expect(
    page.getByRole('button', { name: /16:00.*Maria Oliveira.*Cancelado/ }),
  ).toBeVisible();
  await login(page, 'paciente');
  await page.getByRole('link', { name: 'Histórico', exact: true }).click();
  await expect(
    page
      .locator('.appointment-card')
      .filter({ hasText: '16:00' })
      .getByText('Cancelado', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .locator('.appointment-card')
      .filter({ hasText: '16:00' })
      .getByText('Cancelado', { exact: true }),
  ).toBeVisible();
});
test('todas as rotas e larguras solicitadas renderizam sem overflow', async ({ page }) => {
  test.setTimeout(240000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const routes = [
    '/',
    '/paciente',
    '/paciente/agendar',
    '/paciente/agendamentos',
    '/paciente/historico',
    '/paciente/notificacoes',
    '/paciente/perfil',
    '/medico',
    '/medico/agenda',
    '/medico/pacientes',
    '/medico/prontuarios',
    '/medico/prontuarios/r1',
    '/medico/atendimentos',
    '/medico/notificacoes',
    '/medico/perfil',
    '/clinica',
    '/clinica/agenda',
    '/clinica/agendamentos',
    '/clinica/agendar',
    '/clinica/pacientes',
    '/clinica/profissionais',
    '/clinica/prontuarios',
    '/clinica/especialidades',
    '/clinica/relatorios',
    '/clinica/configuracoes',
  ];
  for (const width of [375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    let currentRole = null;
    for (const route of routes) {
      const role = route.split('/')[1];
      if (role && role !== currentRole) {
        await login(page, role);
        currentRole = role;
      }
      if (!role) {
        const exit = page.getByRole('button', { name: 'Sair', exact: true });
        if (await exit.isVisible()) await exit.click();
      }
      await page.goto(route);
      await expect(page.locator('h1').first()).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        `${route} @ ${width}`,
      ).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});
test('prontuário e agenda mudam de visualização, mobile abre menu', async ({ page }) => {
  await login(page, 'medico');
  await page.goto('/medico/prontuarios/r1');
  await page.getByRole('button', { name: 'Anotações', exact: true }).click();
  await page.getByLabel('Nova anotação fictícia').fill('Observação de teste do cuidado.');
  await page.getByRole('button', { name: 'Salvar anotação' }).click();
  await expect(page.getByText('Observação de teste do cuidado.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Documentos', exact: true }).click();
  await page.getByRole('button', { name: /Resumo do atendimento demonstrativo/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await login(page, 'clinica');
  await page.goto('/clinica/agenda');
  await page.getByRole('button', { name: 'Semana', exact: true }).click();
  await expect(page.locator('.week-calendar')).toBeVisible();
  await page.getByRole('button', { name: 'Mês', exact: true }).click();
  await expect(page.locator('.month-calendar')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('link', { name: 'Configurações', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Configurações', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Configurações da clínica' })).toBeVisible();
});
test('capturas de desktop e mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await login(page, 'paciente');
  await page.goto('/paciente');
  await expect(page.getByRole('heading', { name: 'Olá, Maria 👋' })).toBeVisible();
  await page.screenshot({
    path: '../../docs/front/screenshots/paciente-desktop.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: '../../docs/front/screenshots/paciente-mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await login(page, 'medico');
  await page.goto('/medico/agenda');
  await expect(page.getByRole('heading', { name: 'Minha agenda' })).toBeVisible();
  await page.screenshot({ path: '../../docs/front/screenshots/medico-agenda.png', fullPage: true });
  await login(page, 'clinica');
  await page.goto('/clinica');
  await expect(page.getByRole('heading', { name: 'Um olhar para toda a clínica.' })).toBeVisible();
  await page.screenshot({
    path: '../../docs/front/screenshots/clinica-desktop.png',
    fullPage: true,
    animations: 'disabled',
  });
});

test('clínica cadastra paciente, agenda e especialista inicia o atendimento', async ({ page }) => {
  await login(page, 'clinica');
  await page.goto('/clinica/agendar');
  await page.getByRole('button', { name: 'Cadastrar novo paciente', exact: true }).click();
  await page.getByLabel('Nome completo', { exact: true }).fill('Joana Teste');
  await page.getByLabel('Data de nascimento', { exact: true }).fill('1990-06-15');
  await page.getByLabel('Telefone', { exact: true }).fill('31999990000');
  await page.getByLabel('E-mail', { exact: true }).fill('joana@example.com');
  await page.getByLabel('CPF', { exact: true }).fill('00000000011');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Dermatologia Cuidado e saúde para a sua pele.' }).click();
  await page.getByRole('button', { name: 'Selecionar profissional' }).click();
  await page.getByLabel('Abrir calendário completo').fill(dateAfter(4));
  await page.getByRole('button', { name: '15:30', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar agendamento', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Consulta agendada com sucesso!' })).toBeVisible();
  await login(page, 'medico');
  await page.getByRole('link', { name: 'Minha agenda', exact: true }).click();
  await page.getByLabel('Data', { exact: true }).fill(dateAfter(4));
  await page.getByRole('button', { name: /15:30.*Joana Teste/ }).click();
  await page.getByRole('button', { name: 'Iniciar atendimento', exact: true }).click();
  await expect(
    page.getByRole('button', { name: /15:30.*Joana Teste.*Em atendimento/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: /15:30.*Joana Teste/ }).click();
  await page.getByRole('link', { name: 'Ver prontuário', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Joana Teste', exact: true })).toBeVisible();
});
