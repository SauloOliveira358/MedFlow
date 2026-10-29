import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

const STORAGE_THEME_KEY = 'medflow-theme';
const STORAGE_A11Y_KEY = 'medflow-a11y';

const defaultA11yState = {
  fontSize: 'normal', // 'normal' | 'large' | 'xlarge'
  highContrast: false,
  reduceMotion: false,
  readableFont: false,
};

const initialContext = {
  theme: 'system',
  effectiveTheme: 'light',
  fontSize: 'normal',
  highContrast: false,
  reduceMotion: false,
  readableFont: false,
  modalOpen: false,
  setTheme: () => {},
  toggleTheme: () => {},
  setFontSize: () => {},
  setHighContrast: () => {},
  setReduceMotion: () => {},
  setReadableFont: () => {},
  resetPreferences: () => {},
  openModal: () => {},
  closeModal: () => {},
};

export const AcessibilidadeContext = createContext(initialContext);

export function AcessibilidadeProvider({ children }) {
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THEME_KEY);
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'system'; // Por padrão, segue automaticamente a preferência do Windows/dispositivo
  });

  const [a11y, setA11y] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_A11Y_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultA11yState,
          ...parsed,
        };
      }
    } catch {
      // fallback
    }
    return defaultA11yState;
  });

  const [modalOpen, setModalOpen] = useState(false);

  // Monitora alterações dinâmicas do tema do Windows/dispositivo
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPrefersDark(mediaQuery.matches);

    const handler = (e) => setSystemPrefersDark(e.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, []);

  const effectiveTheme = theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;

  // Sincroniza tema ativo com o DOM no <html>
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', effectiveTheme);
    try {
      localStorage.setItem(STORAGE_THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme, effectiveTheme]);

  // Sincroniza preferências de acessibilidade com o DOM e localStorage
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-font-size', a11y.fontSize);
    root.setAttribute('data-high-contrast', a11y.highContrast ? 'true' : 'false');
    root.setAttribute('data-reduce-motion', a11y.reduceMotion ? 'true' : 'false');
    root.setAttribute('data-readable-font', a11y.readableFont ? 'true' : 'false');

    try {
      localStorage.setItem(STORAGE_A11Y_KEY, JSON.stringify(a11y));
    } catch {
      // ignore
    }
  }, [a11y]);

  const setTheme = useCallback((t) => {
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const current = prev === 'system' ? (systemPrefersDark ? 'dark' : 'light') : prev;
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [systemPrefersDark]);

  const setFontSize = useCallback((fontSize) => {
    setA11y((prev) => ({ ...prev, fontSize }));
  }, []);

  const setHighContrast = useCallback((highContrast) => {
    setA11y((prev) => ({ ...prev, highContrast: Boolean(highContrast) }));
  }, []);

  const setReduceMotion = useCallback((reduceMotion) => {
    setA11y((prev) => ({ ...prev, reduceMotion: Boolean(reduceMotion) }));
  }, []);

  const setReadableFont = useCallback((readableFont) => {
    setA11y((prev) => ({ ...prev, readableFont: Boolean(readableFont) }));
  }, []);

  const resetPreferences = useCallback(() => {
    setThemeState('system');
    setA11y(defaultA11yState);
  }, []);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  // Atalhos de teclado: Alt+T (Tema), Alt+A (Acessibilidade), Esc (Fechar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        toggleTheme();
      } else if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setModalOpen((prev) => !prev);
      } else if (e.key === 'Escape' && modalOpen) {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme, modalOpen, closeModal]);

  const value = useMemo(
    () => ({
      theme,
      effectiveTheme,
      fontSize: a11y.fontSize,
      highContrast: a11y.highContrast,
      reduceMotion: a11y.reduceMotion,
      readableFont: a11y.readableFont,
      modalOpen,
      setTheme,
      toggleTheme,
      setFontSize,
      setHighContrast,
      setReduceMotion,
      setReadableFont,
      resetPreferences,
      openModal,
      closeModal,
    }),
    [
      theme,
      effectiveTheme,
      a11y.fontSize,
      a11y.highContrast,
      a11y.reduceMotion,
      a11y.readableFont,
      modalOpen,
      setTheme,
      toggleTheme,
      setFontSize,
      setHighContrast,
      setReduceMotion,
      setReadableFont,
      resetPreferences,
      openModal,
      closeModal,
    ],
  );

  return <AcessibilidadeContext.Provider value={value}>{children}</AcessibilidadeContext.Provider>;
}

export function useAcessibilidade() {
  return useContext(AcessibilidadeContext);
}
