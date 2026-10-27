import { focusablesIn } from './focusablesIn';

/**
 * What a modal focuses as it opens: its first field, else the open item of its nav, else
 * its first control above the footer, else itself.
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
