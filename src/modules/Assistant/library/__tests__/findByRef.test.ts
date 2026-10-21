import { describe, expect, it } from 'vitest';
import { findByRef } from '@/modules/Assistant/library';

const ITEMS = [
  { id: 'w1', name: 'Checkout' },
  { id: 'w2', name: 'Login' },
  { id: 'w3', name: 'login' },
];

describe('findByRef', () => {
  it('finds an item by its id first, then by its name in any case', () => {
    expect(findByRef({ items: ITEMS, ref: 'w2', noun: 'workspace' })).toEqual({
      isFound: true,
      item: { id: 'w2', name: 'Login' },
    });
    expect(findByRef({ items: ITEMS, ref: ' CHECKOUT ', noun: 'workspace' })).toEqual({
      isFound: true,
      item: { id: 'w1', name: 'Checkout' },
    });
  });

  it('does NOT guess between two items with the same name', () => {
    expect(findByRef({ items: ITEMS, ref: 'Login', noun: 'workspace' })).toEqual({
      isFound: false,
      text: '2 workspaces are called "Login": w2, w3. Name one by its id.',
    });
  });

  it('lists what there is when nothing matches, or says there is nothing yet', () => {
    expect(
      findByRef({ items: ITEMS.slice(0, 1), ref: 'Cart', noun: 'workspace' }),
    ).toEqual({
      isFound: false,
      text: 'There is no workspace "Cart". The workspaces are w1 "Checkout".',
    });
    expect(findByRef({ items: [], ref: 'Cart', noun: 'project' })).toEqual({
      isFound: false,
      text: 'There is no project yet.',
    });
  });
});
