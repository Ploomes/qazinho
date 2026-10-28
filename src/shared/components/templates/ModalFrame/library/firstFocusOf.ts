import { focusablesIn } from './focusablesIn';

/**
 * O que um modal foca ao abrir: o primeiro campo, senão o item aberto do nav, senão o
 * primeiro controle acima do rodapé, senão ele mesmo.
 */
export function firstFocusOf(panel: HTMLElement): HTMLElement {
  const items = focusablesIn(panel);

  return (
    items.find((item) => /^(INPUT|TEXTAREA|SELECT)$/.test(item.tagName)) ??
    items.find((item) => item.getAttribute('aria-current') === 'true') ??
    items.find((item) => item.closest('[data-modal-foot]') === null) ??
    panel
  );
}
