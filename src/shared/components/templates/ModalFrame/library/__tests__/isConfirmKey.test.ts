import { describe, expect, it } from 'vitest';
import { isConfirmKey } from '@/shared/components/templates/ModalFrame/library';

const FIELD = {
  key: 'Enter',
  isHandled: false,
  hasModifier: false,
  tag: 'INPUT',
  type: 'text',
  role: null,
};

describe('isConfirmKey', () => {
  it('confirms on Enter in a field the QA types in', () => {
    expect(isConfirmKey(FIELD)).toBe(true);
    expect(isConfirmKey({ ...FIELD, type: 'url' })).toBe(true);
  });

  it('does NOT confirm on Enter in a text area, where it starts a new line', () => {
    expect(isConfirmKey({ ...FIELD, tag: 'TEXTAREA', type: '' })).toBe(false);
  });

  /** Uma lista de busca escolhe a linha destacada no Enter; o modal não pode ir junto. */
  it('does NOT confirm what a list inside already handled, nor in a search box', () => {
    expect(isConfirmKey({ ...FIELD, isHandled: true })).toBe(false);
    expect(isConfirmKey({ ...FIELD, role: 'combobox' })).toBe(false);
  });

  it('does NOT confirm on a button, a checkbox, another key or with a modifier', () => {
    expect(isConfirmKey({ ...FIELD, tag: 'BUTTON' })).toBe(false);
    expect(isConfirmKey({ ...FIELD, type: 'checkbox' })).toBe(false);
    expect(isConfirmKey({ ...FIELD, key: 'a' })).toBe(false);
    expect(isConfirmKey({ ...FIELD, hasModifier: true })).toBe(false);
  });
});
