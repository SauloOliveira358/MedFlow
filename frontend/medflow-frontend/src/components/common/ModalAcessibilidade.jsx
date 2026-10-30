import React, { useEffect, useRef } from 'react';
import { useAcessibilidade } from '../../context/AcessibilidadeContext';
import Icone from './Icone';

export default function ModalAcessibilidade() {
  const {
    modalOpen,
    closeModal,
    theme,
    effectiveTheme,
    setTheme,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    reduceMotion,
    setReduceMotion,
    readableFont,
    setReadableFont,
    resetPreferences,
  } = useAcessibilidade();

  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (modalOpen && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [modalOpen]);

  if (!modalOpen) return null;

  return (
    <div
      className="modal-scrim visible a11y-scrim"
      onClick={closeModal}
      role="presentation"
      style={{ zIndex: 120 }}
    >
      <div
        className="modal-card a11y-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="a11y-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px', width: '92%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="icon-box sage" style={{ width: '38px', height: '38px' }}>
              <Icone name="accessibility" size={20} />
            </span>
            <div>
              <h2 id="a11y-modal-title" style={{ fontSize: '18px', margin: 0 }}>
                Acessibilidade e Aparência
              </h2>
              <small style={{ color: 'var(--muted)' }}>
                Personalize o visual e a experiência do MedFlow
              </small>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            className="icon-button close-menu"
            style={{ display: 'inline-flex' }}
            onClick={closeModal}
            aria-label="Fechar painel de acessibilidade"
          >
            <Icone name="x" size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '18px 0' }}>
          {/* SEÇÃO 1: TEMA (MODO ESCURO / CLARO) */}
          <div className="a11y-section">
            <span className="eyebrow" style={{ marginBottom: '6px' }}>TEMA VISUAL</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                className={`button secondary ${theme === 'light' ? 'a11y-active' : ''}`}
                onClick={() => setTheme('light')}
                aria-pressed={theme === 'light'}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '12px 8px',
                  height: 'auto',
                  border: theme === 'light' ? '2px solid var(--primary)' : '1px solid var(--line)',
                  background: theme === 'light' ? 'rgba(84, 134, 123, 0.08)' : 'transparent',
                }}
              >
                <Icone name="sun" size={20} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Claro</span>
              </button>

              <button
                type="button"
                className={`button secondary ${theme === 'dark' ? 'a11y-active' : ''}`}
                onClick={() => setTheme('dark')}
                aria-pressed={theme === 'dark'}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '12px 8px',
                  height: 'auto',
                  border: theme === 'dark' ? '2px solid var(--primary)' : '1px solid var(--line)',
                  background: theme === 'dark' ? 'rgba(84, 134, 123, 0.08)' : 'transparent',
                }}
              >
                <Icone name="moon" size={20} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Escuro</span>
              </button>

              <button
                type="button"
                className={`button secondary ${theme === 'system' ? 'a11y-active' : ''}`}
                onClick={() => setTheme('system')}
                aria-pressed={theme === 'system'}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '12px 8px',
                  height: 'auto',
                  border: theme === 'system' ? '2px solid var(--primary)' : '1px solid var(--line)',
                  background: theme === 'system' ? 'rgba(84, 134, 123, 0.08)' : 'transparent',
                }}
              >
                <Icone name="settings" size={20} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Automático</span>
              </button>
            </div>
            <small style={{ marginTop: '6px', display: 'block', color: 'var(--muted)' }}>
              Tema ativo no momento: <strong>{effectiveTheme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}</strong>
            </small>
          </div>

          {/* SEÇÃO 2: TAMANHO DO TEXTO */}
          <div className="a11y-section">
            <span className="eyebrow" style={{ marginBottom: '6px' }}>TAMANHO DO TEXTO</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                ['small', 'Pequeno (90%)', '11px'],
                ['normal', 'Padrão (100%)', '12px'],
                ['large', 'Grande (115%)', '14px'],
              ].map(([value, label, preview]) => (
                <button
                  key={value}
                  type="button"
                  className={`button secondary ${fontSize === value ? 'a11y-active' : ''}`}
                  onClick={() => setFontSize(value)}
                  aria-pressed={fontSize === value}
                  style={{
                    padding: '10px 8px',
                    border: fontSize === value ? '2px solid var(--primary)' : '1px solid var(--line)',
                    background: fontSize === value ? 'rgba(84, 134, 123, 0.08)' : 'transparent',
                    fontWeight: 600,
                    fontSize: preview,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* SEÇÃO 3: RECURSOS VISUAIS (ALTO CONTRASTE, FONTE LEGÍVEL, REDUZIR MOVIMENTO) */}
          <div className="a11y-section" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span className="eyebrow">PREFERÊNCIAS DE ACESSIBILIDADE</span>

            {/* Alto Contraste */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                border: '1px solid var(--line)',
                borderRadius: '9px',
                cursor: 'pointer',
                background: highContrast ? 'rgba(84, 134, 123, 0.06)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icone name="contrast" size={18} />
                <div>
                  <strong style={{ display: 'block', fontSize: '13px' }}>Alto Contraste</strong>
                  <small style={{ color: 'var(--muted)' }}>
                    Bordas e elementos mais nítidos para melhor visibilidade
                  </small>
                </div>
              </div>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                style={{ width: '20px', height: '20px', minHeight: 'auto', cursor: 'pointer' }}
                aria-label="Ativar alto contraste"
              />
            </label>

            {/* Fonte com Maior Legibilidade */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                border: '1px solid var(--line)',
                borderRadius: '9px',
                cursor: 'pointer',
                background: readableFont ? 'rgba(84, 134, 123, 0.06)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icone name="type" size={18} />
                <div>
                  <strong style={{ display: 'block', fontSize: '13px' }}>Fonte Mais Legível</strong>
                  <small style={{ color: 'var(--muted)' }}>
                    Tipografia limpa com espaçamento otimizado para leitura
                  </small>
                </div>
              </div>
              <input
                type="checkbox"
                checked={readableFont}
                onChange={(e) => setReadableFont(e.target.checked)}
                style={{ width: '20px', height: '20px', minHeight: 'auto', cursor: 'pointer' }}
                aria-label="Ativar fonte mais legível"
              />
            </label>

            {/* Reduzir Movimento */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                border: '1px solid var(--line)',
                borderRadius: '9px',
                cursor: 'pointer',
                background: reduceMotion ? 'rgba(84, 134, 123, 0.06)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icone name="activity" size={18} />
                <div>
                  <strong style={{ display: 'block', fontSize: '13px' }}>Reduzir Animações</strong>
                  <small style={{ color: 'var(--muted)' }}>
                    Minimiza transições e efeitos dinâmicos de movimento
                  </small>
                </div>
              </div>
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={(e) => setReduceMotion(e.target.checked)}
                style={{ width: '20px', height: '20px', minHeight: 'auto', cursor: 'pointer' }}
                aria-label="Reduzir animações e transições de movimento"
              />
            </label>
          </div>

          {/* DICAS DE ATALHOS */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '9px',
              background: 'var(--card, #f0f4ef)',
              border: '1px solid var(--line)',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <strong>Atalhos de teclado:</strong>
            <span style={{ color: 'var(--muted)' }}>
              • <kbd>Alt + T</kbd>: Alternar modo escuro / claro rapidamente
            </span>
            <span style={{ color: 'var(--muted)' }}>
              • <kbd>Alt + A</kbd>: Abrir / fechar opções de acessibilidade
            </span>
            <span style={{ color: 'var(--muted)' }}>
              • <kbd>Esc</kbd>: Fechar esta janela
            </span>
          </div>
        </div>

        <div
          className="modal-footer"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '14px',
            borderTop: '1px solid var(--line)',
          }}
        >
          <button
            type="button"
            className="button secondary small"
            onClick={resetPreferences}
            title="Restaurar todas as opções visuais para o padrão inicial"
          >
            Restaurar padrões
          </button>
          <button type="button" className="button primary small" onClick={closeModal}>
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
