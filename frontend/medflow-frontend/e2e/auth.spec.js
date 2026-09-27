import { test, expect } from '@playwright/test';

async function enter(page, email, password = 'MedFlow123!') {
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}
test('login inicial, cadastro público, consulta própria e restrição de áreas', async ({ page }) => {
  await page.goto('/clinica/profissionais');
  await expect(page).toHaveURL(/\/$/);
  await enter(page, 'admin@medflow.demo', 'incorreta');
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos');
  await page.getByRole('link', { name: 'Criar minha conta' }).click();
  await page.getByLabel('Nome completo').fill('Carolina Teste');
  await page.getByLabel('Data de nascimento').fill('1994-05-10');
  await page.getByLabel('Telefone', { exact: true }).fill('31988887777');
  await page.getByLabel('E-mail', { exact: true }).fill('carolina@example.com');
  await page.getByLabel('CPF', { exact: true }).fill('00000000991');
  await page.getByLabel('Senha', { exact: true }).fill('Teste123!');
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Teste123!');
  await page.getByRole('button', { name: 'Criar conta e continuar' }).click();
  await expect(page).toHaveURL(/\/paciente\/agendar$/);
  await page.getByRole('button', { name: /Dermatologia Cuidado/ }).click();
  await page.getByRole('button', { name: 'Selecionar profissional' }).click();
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const dateValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  await page.getByLabel('Abrir calendário completo').fill(dateValue);
  await page.getByRole('button', { name: '16:00', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByLabel('Nome completo')).toHaveValue('Carolina Teste');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar agendamento', exact: true }).click();
  await page.getByRole('link', { name: 'Ver meus agendamentos', exact: true }).click();
  await expect(page.locator('.appointment-card')).toHaveCount(1);
  await page.goto('/clinica/profissionais');
  await expect(page).toHaveURL(/\/paciente$/);
  await expect(page.getByRole('button', { name: 'Cadastrar médico' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.goto('/paciente/agendamentos');
  await enter(page, 'carolina@example.com', 'Teste123!');
  await expect(page).toHaveURL(/\/paciente\/agendamentos$/);
  await expect(page.locator('.appointment-card')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.appointment-card')).toHaveCount(1);
});

test('somente administrador cadastra médico e o novo acesso funciona', async ({ page }) => {
  await page.goto('/');
  await enter(page, 'admin@medflow.demo');
  await page.getByRole('link', { name: 'Profissionais', exact: true }).click();
  await page.getByRole('button', { name: 'Cadastrar médico', exact: true }).click();
  await page.getByLabel('Nome do profissional').fill('Dra. Beatriz Teste');
  await page.getByRole('dialog').getByRole('combobox', { name: 'Especialidade', exact: true }).selectOption('s1');
  await page.getByLabel('Registro profissional').fill('CRM-MG 999001');
  await page.getByLabel('Telefone', { exact: true }).fill('31988880000');
  await page.getByLabel('E-mail de acesso').fill('beatriz@example.com');
  await page.getByLabel('Senha de acesso').fill('Medica123!');
  await page.getByLabel('Confirmar senha').fill('Medica123!');
  await page.getByRole('button', { name: 'Criar conta do médico', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Dra. Beatriz Teste', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await enter(page, 'beatriz@example.com', 'Medica123!');
  await expect(page).toHaveURL(/\/medico$/);
  await expect(page.getByRole('heading', { name: /Olá, Dra. Beatriz/ })).toBeVisible();
  await page.goto('/clinica/profissionais');
  await expect(page).toHaveURL(/\/medico$/);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await enter(page, 'maria@medflow.demo');
  await expect(page).toHaveURL(/\/paciente$/);
  await page.goto('/paciente/agendar');
  await page.getByRole('button', { name: /Dermatologia Cuidado/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Dra. Beatriz Teste', exact: true }),
  ).toBeVisible();
});

test('login e cadastro responsivos nas seis larguras', async ({ page }) => {
  for (const width of [375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/cadastro']) {
      await page.goto(route);
      await expect(
        page.getByRole('button', {
          name: route === '/' ? 'Entrar' : 'Criar conta e continuar',
          exact: true,
        }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      if ([390, 1440].includes(width))
        await page.screenshot({
          path: `../../docs/front/screenshots/${route === '/' ? 'login' : 'cadastro'}-${width}.png`,
          fullPage: true,
          animations: 'disabled',
        });
    }
  }
});
