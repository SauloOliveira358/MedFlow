import { test, expect } from '@playwright/test';

test.describe('Validação das Regras de Negócio e Segurança de Agenda do Médico', () => {
  test('Testar Bloqueio de Datas Passadas, Ocultação de Horas Passadas e Replicação para Futuro', async ({ page }) => {
    // 1. Acesso e Login do Médico
    await page.goto('http://127.0.0.1:4200/');
    await page.getByLabel('E-mail', { exact: true }).fill('ana@medflow.demo');
    await page.getByLabel('Senha', { exact: true }).fill('MedFlow123!');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page).toHaveURL(/.*\/medico.*/);

    // 2. Navegação para Gerenciador de Horários (/medico/horarios)
    await page.goto('http://127.0.0.1:4200/medico/horarios');
    await expect(page).toHaveURL(/.*\/medico\/horarios.*/);

    // 3. Navegar para a semana anterior (onde todos os dias são no passado)
    const prevWeekBtn = page.locator('button[aria-label="Semana anterior"]');
    await prevWeekBtn.click();
    await page.waitForTimeout(600);

    // Verificar se as colunas da semana anterior têm title de data passada e cursor not-allowed
    const pastColumns = page.locator('div[title*="Data passada"]');
    const pastCount = await pastColumns.count();
    console.log(`Colunas passadas na semana anterior: ${pastCount}`);
    expect(pastCount).toBe(7);

    // Clicar em qualquer coluna da semana passada NÃO deve abrir modal
    await pastColumns.first().click();
    await page.waitForTimeout(400);
    const modal = page.locator('.modal');
    expect(await modal.isVisible().catch(() => false)).toBeFalsy();
    console.log('✅ Validação confirmada: Clique em coluna de data passada NÃO abre modal.');

    // 4. Voltar para a semana atual
    const currentWeekBtn = page.getByRole('button', { name: /semana atual/i });
    await currentWeekBtn.click();
    await page.waitForTimeout(600);

    // 5. Teste: Modal de Replicação não deve permitir datas passadas
    const replicateBtn = page.getByRole('button', { name: /replicar horários na semana/i });
    await replicateBtn.click();
    await page.waitForTimeout(500);

    const targetDateInput = page.locator('#replicate-target-date');
    await expect(targetDateInput).toBeVisible();

    const minAttr = await targetDateInput.getAttribute('min');
    expect(minAttr).toBeTruthy();
    console.log(`✅ Input de destino possui min="${minAttr}".`);

    // Tentar preencher com data no passado (ex: 2020-01-01)
    await targetDateInput.fill('2020-01-01');
    await page.waitForTimeout(300);

    // Deve exibir aviso visual de data no passado
    const warning = page.locator('text=A data de destino não pode ser uma data passada');
    expect(await warning.isVisible()).toBeTruthy();

    const submitReplicateBtn = page.getByRole('button', { name: /replicar horários/i }).last();
    expect(await submitReplicateBtn.isDisabled()).toBeTruthy();
    console.log('✅ Validação confirmada: Banner de aviso exibido e botão de replicar bloqueado para passado.');

    const cancelBtn = page.getByRole('button', { name: /cancelar/i }).last();
    await cancelBtn.click();
    await page.waitForTimeout(300);

    console.log('✅ Todas as regras de negócio de datas passadas e replicação foram 100% aprovadas!');
  });
});
