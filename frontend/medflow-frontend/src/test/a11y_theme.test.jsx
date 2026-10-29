import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  AcessibilidadeProvider,
  useAcessibilidade,
} from '../context/AcessibilidadeContext';
import ModalAcessibilidade from '../components/common/ModalAcessibilidade';
import { CabecalhoSuperior } from '../layouts/LayoutArea';
import { DemoProvider } from '../context/DemoContext';
import { createMockData } from '../data/mockData';
import { testAccounts } from './fixtures/accounts';

function TestControls() {
  const {
    theme,
    effectiveTheme,
    toggleTheme,
    setTheme,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    readableFont,
    setReadableFont,
    reduceMotion,
    setReduceMotion,
    resetPreferences,
    openModal,
  } = useAcessibilidade();

  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="effective-theme">{effectiveTheme}</span>
      <span data-testid="current-size">{fontSize}</span>
      <span data-testid="high-contrast">{highContrast ? 'yes' : 'no'}</span>
      <span data-testid="readable-font">{readableFont ? 'yes' : 'no'}</span>
      <span data-testid="reduce-motion">{reduceMotion ? 'yes' : 'no'}</span>

      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setFontSize('large')}>Set Large</button>
      <button onClick={() => setFontSize('xlarge')}>Set XLarge</button>
      <button onClick={() => setHighContrast(true)}>Set High Contrast</button>
      <button onClick={() => setReadableFont(true)}>Set Readable Font</button>
      <button onClick={() => setReduceMotion(true)}>Set Reduce Motion</button>
      <button onClick={resetPreferences}>Reset All</button>
      <button onClick={openModal}>Open Modal</button>
    </div>
  );
}

describe('Acessibilidade e Modo Escuro (MedFlow)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-font-size');
    document.documentElement.removeAttribute('data-high-contrast');
    document.documentElement.removeAttribute('data-readable-font');
    document.documentElement.removeAttribute('data-reduce-motion');

    // Default clean matchMedia (light system mode)
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('inicia no tema automático (sistema) por padrão e segue tema claro do SO', () => {
    render(
      <AcessibilidadeProvider>
        <TestControls />
      </AcessibilidadeProvider>,
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('system');
    expect(screen.getByTestId('effective-theme').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-font-size')).toBe('normal');
    expect(document.documentElement.getAttribute('data-high-contrast')).toBe('false');
  });

  it('inicia no modo escuro automaticamente se o sistema/Windows estiver no modo escuro', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <AcessibilidadeProvider>
        <TestControls />
      </AcessibilidadeProvider>,
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('system');
    expect(screen.getByTestId('effective-theme').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('permite alternar para modo escuro e salva no localStorage', () => {
    render(
      <AcessibilidadeProvider>
        <TestControls />
      </AcessibilidadeProvider>,
    );

    const toggleBtn = screen.getByText('Toggle Theme');
    fireEvent.click(toggleBtn);

    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(screen.getByTestId('effective-theme').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('medflow-theme')).toBe('dark');

    // Alternar de volta para o claro
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('current-theme').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('medflow-theme')).toBe('light');
  });

  it('ajusta escala de fonte (normal, large, xlarge)', () => {
    render(
      <AcessibilidadeProvider>
        <TestControls />
      </AcessibilidadeProvider>,
    );

    fireEvent.click(screen.getByText('Set Large'));
    expect(screen.getByTestId('current-size').textContent).toBe('large');
    expect(document.documentElement.getAttribute('data-font-size')).toBe('large');

    fireEvent.click(screen.getByText('Set XLarge'));
    expect(screen.getByTestId('current-size').textContent).toBe('xlarge');
    expect(document.documentElement.getAttribute('data-font-size')).toBe('xlarge');
  });

  it('permite ativar alto contraste, fonte legível e redução de movimento', () => {
    render(
      <AcessibilidadeProvider>
        <TestControls />
      </AcessibilidadeProvider>,
    );

    fireEvent.click(screen.getByText('Set High Contrast'));
    expect(screen.getByTestId('high-contrast').textContent).toBe('yes');
    expect(document.documentElement.getAttribute('data-high-contrast')).toBe('true');

    fireEvent.click(screen.getByText('Set Readable Font'));
    expect(screen.getByTestId('readable-font').textContent).toBe('yes');
    expect(document.documentElement.getAttribute('data-readable-font')).toBe('true');

    fireEvent.click(screen.getByText('Set Reduce Motion'));
    expect(screen.getByTestId('reduce-motion').textContent).toBe('yes');
    expect(document.documentElement.getAttribute('data-reduce-motion')).toBe('true');

    // Restaurar padrões
    fireEvent.click(screen.getByText('Reset All'));
    expect(screen.getByTestId('high-contrast').textContent).toBe('no');
    expect(document.documentElement.getAttribute('data-high-contrast')).toBe('false');
    expect(screen.getByTestId('readable-font').textContent).toBe('no');
    expect(document.documentElement.getAttribute('data-readable-font')).toBe('false');
  });

  it('abre e interage com o ModalAcessibilidade', () => {
    render(
      <AcessibilidadeProvider>
        <TestControls />
        <ModalAcessibilidade />
      </AcessibilidadeProvider>,
    );

    // Modal começa fechado
    expect(screen.queryByRole('dialog')).toBeNull();

    // Abre o modal
    fireEvent.click(screen.getByText('Open Modal'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Acessibilidade e Aparência')).toBeTruthy();

    // Seleciona Modo Escuro via modal
    const escuroBtn = screen.getByRole('button', { name: /Escuro/i });
    fireEvent.click(escuroBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    // Seleciona texto Grande
    const grandeBtn = screen.getByRole('button', { name: /Grande \(115%\)/i });
    fireEvent.click(grandeBtn);
    expect(document.documentElement.getAttribute('data-font-size')).toBe('large');

    // Fecha o modal via botão Concluir
    const concluirBtn = screen.getByRole('button', { name: /Concluir/i });
    fireEvent.click(concluirBtn);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('exibe os botões de alternância de tema e acessibilidade no CabecalhoSuperior', () => {
    const mockData = {
      ...createMockData(),
      accounts: structuredClone(testAccounts),
    };
    localStorage.setItem('medflow-session', mockData.accounts[0].id);

    render(
      <DemoProvider initialData={mockData}>
        <AcessibilidadeProvider>
          <MemoryRouter>
            <CabecalhoSuperior area="paciente" onMenu={() => {}} />
          </MemoryRouter>
        </AcessibilidadeProvider>
      </DemoProvider>,
    );

    const a11yBtn = screen.getByRole('button', { name: /Abrir opções de acessibilidade e tema/i });
    expect(a11yBtn).toBeTruthy();

    const themeBtn = screen.getByRole('button', { name: /Mudar para modo escuro/i });
    expect(themeBtn).toBeTruthy();

    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
