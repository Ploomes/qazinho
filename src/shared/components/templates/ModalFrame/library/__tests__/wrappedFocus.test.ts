import { describe, expect, it } from 'vitest';
import { wrappedFocus } from '@/shared/components/templates/ModalFrame/library';

const ITEMS = ['name', 'url', 'cancel', 'create'];

describe('wrappedFocus', () => {
  it('goes round from the last to the first, and back', () => {
    expect(wrappedFocus({ items: ITEMS, current: 'create', isBack: false })).toBe('name');
    expect(wrappedFocus({ items: ITEMS, current: 'name', isBack: true })).toBe('create');
  });

  it('does NOT step in when the browser moves within the modal', () => {
    expect(wrappedFocus({ items: ITEMS, current: 'url', isBack: false })).toBeNull();
    expect(wrappedFocus({ items: ITEMS, current: 'url', isBack: true })).toBeNull();
  });

  /** Focus left behind on the button that opened the modal must come into it. */
  it('brings focus in from outside the modal', () => {
    expect(wrappedFocus({ items: ITEMS, current: 'behind', isBack: false })).toBe('name');
    expect(wrappedFocus({ items: ITEMS, current: null, isBack: true })).toBe('create');
  });

  it('has nothing to do in a modal with nothing to focus', () => {
    expect(wrappedFocus({ items: [], current: null, isBack: false })).toBeNull();
  });
});
