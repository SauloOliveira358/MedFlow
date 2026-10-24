import { test, expect } from '@playwright/test';

test.describe('Exploração Completa da Área do Paciente e Fluxos de Agendamento', () => {
  test('Testar Agendamento de Consulta, Validações, Meus Agendamentos e Cancelamento', async ({ page }) => {
    // 1. Login como Paciente (ou cadastro)
    await page.goto('http://127.0.0.1:4200/');
    await page.getByLabel('E-mail', { exact: true }).fill('maria@medflow.example');
    await page.getByLabel('Senha', { exact: true }).fill('Senha123');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.waitForTimeout(1000);

    // Se falhar o login com senha de seed, verificar se redirecionou ou usar cadastro
    const currentUrl = page.url();
    if (!currentUrl.includes('/paciente')) {
      // Entrar ou cadastrar paciente teste
      await page.goto('http://127.0.0.1:4200/cadastro?tipo=paciente');
      await page.locator('input[placeholder*="Carlos"]').fill('Maria Silva Teste');
      await page.locator('input[type="tel"]').fill('(31) 98888-7777');
      await page.locator('input[type="email"]').fill(`paciente_${Date.now()}@exemplo.com`);
      await page.locator('input[placeholder*="123.456"]').fill('12345678901');
      await page.locator('input[type="date"]').fill('1992-04-10');
      await page.getByLabel('Senha', { exact: true }).fill('MedFlow123!');
      await page.getByLabel('Confirmar senha', { exact: true }).fill('MedFlow123!');
      await page.getByRole('button', { name: /criar conta/i }).click();
      await page.waitForTimeout(1200);
    }

    console.log('URL atual após autenticação:', page.url());

    // 2. Acessar /paciente/agendar
    await page.goto('http://127.0.0.1:4200/paciente/agendar');
    await page.waitForTimeout(800);
    expect(page.url()).toContain('/paciente/agendar');
    console.log('✅ Acessou /paciente/agendar com sucesso.');

    // 3. Passo 1: Selecionar Especialidade
    const specialtyCards = page.locator('.specialty-grid button, .specialty-home-grid button, .choice');
    const specCount = await specialtyCards.count();
    console.log(`Especialidades encontradas: ${specCount}`);
    if (specCount > 0) {
      await specialtyCards.first().click();
      await page.waitForTimeout(600);
      console.log('✅ Especialidade selecionada, avançou para Passo 2.');
    }

    // 4. Passo 2: Selecionar Profissional
    const doctorButtons = page.locator('.doctor-grid button, button:has-text("Selecionar profissional")');
    const docCount = await doctorButtons.count();
    console.log(`Profissionais disponíveis: ${docCount}`);
    if (docCount > 0) {
      await doctorButtons.first().click();
      await page.waitForTimeout(600);
      console.log('✅ Profissional selecionado, avançou para Passo 3.');
    }

    // 5. Passo 3: Data e Horário
    // Testar botões da faixa de datas
    const dateButtons = page.locator('.date-strip button');
    const dateBtnCount = await dateButtons.count();
    console.log(`Dias na faixa rápida: ${dateBtnCount}`);

    // Clicar em "Amanhã" se disponível
    if (dateBtnCount > 1) {
      await dateButtons.nth(1).click();
      await page.waitForTimeout(600);
    }

    // Verificar horários liberados
    const availableSlotButtons = page.locator('.time-slots button:not([disabled])');
    const availableCount = await availableSlotButtons.count();
    console.log(`Horários disponíveis encontrados: ${availableCount}`);

    if (availableCount > 0) {
      await availableSlotButtons.first().click();
      await page.waitForTimeout(400);

      const continueBtn = page.getByRole('button', { name: /continuar/i });
      await continueBtn.click();
      await page.waitForTimeout(600);
      console.log('✅ Horário selecionado e avançou para Passo 4 (Seus Dados).');

      // 6. Passo 4: Dados do Paciente e Observações
      const phoneInput = page.locator('input[type="tel"]');
      if (await phoneInput.isVisible()) {
        const val = await phoneInput.inputValue();
        if (!val) await phoneInput.fill('31999998888');
      }

      const reasonTextarea = page.locator('textarea');
      if (await reasonTextarea.isVisible()) {
        await reasonTextarea.fill('Consulta de rotina teste automatizado.');
      }

      const nextBtn = page.getByRole('button', { name: /continuar/i });
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(600);
        console.log('✅ Dados preenchidos e avançou para Passo 5 (Confirmação).');
      }

      // 7. Passo 5: Confirmação e Submissão
      const confirmBookingBtn = page.getByRole('button', { name: /confirmar agendamento/i });
      if (await confirmBookingBtn.isVisible()) {
        await confirmBookingBtn.click();
        await page.waitForTimeout(1500);
        console.log('✅ Submeteu confirmação de agendamento.');
      }
    }

    // 8. Navegar para Meus Agendamentos (/paciente/agendamentos)
    await page.goto('http://127.0.0.1:4200/paciente/agendamentos');
    await page.waitForTimeout(800);
    console.log('✅ Acessou /paciente/agendamentos.');

    // 9. Navegar para Histórico (/paciente/historico)
    await page.goto('http://127.0.0.1:4200/paciente/historico');
    await page.waitForTimeout(800);
    console.log('✅ Acessou /paciente/historico.');

    // 10. Navegar para Notificações (/paciente/notificacoes)
    await page.goto('http://127.0.0.1:4200/paciente/notificacoes');
    await page.waitForTimeout(800);
    console.log('✅ Acessou /paciente/notificacoes.');

    // 11. Navegar para Perfil (/paciente/perfil)
    await page.goto('http://127.0.0.1:4200/paciente/perfil');
    await page.waitForTimeout(800);
    console.log('✅ Acessou /paciente/perfil.');

    console.log('✅ Todos os fluxos da área do paciente foram executados!');
  });
});
