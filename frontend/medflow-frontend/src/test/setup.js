import { webcrypto } from 'node:crypto';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
window.scrollTo = vi.fn();
window.__VITEST__ = true;
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open');
};

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
