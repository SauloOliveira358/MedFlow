import { useEffect } from 'react';
export default function useDrawerFocus(open, onClose) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const drawer = document.querySelector('.sidebar.open');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => drawer?.querySelector('.close-menu')?.focus(), 0);
    const keydown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab') {
        const items = [...drawer.querySelectorAll('a,button,select,input')].filter(
          (el) => !el.disabled && el.getClientRects().length,
        );
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', keydown);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open, onClose]);
}
