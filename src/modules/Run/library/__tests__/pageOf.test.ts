import { describe, expect, it } from 'vitest';
import { pageOf } from '@/modules/Run/library';

const TWELVE = Array.from({ length: 12 }, (_, index) => index + 1);

describe('pageOf', () => {
  it('shows the page asked for, and where it sits in the list', () => {
    expect(pageOf({ items: TWELVE, page: 1, size: 5 })).toEqual({
      items: [6, 7, 8, 9, 10],
      page: 1,
      pageCount: 3,
      from: 6,
      to: 10,
    });
  });

  it('shows what is left on the last page', () => {
    expect(pageOf({ items: TWELVE, page: 2, size: 5 }).items).toEqual([11, 12]);
  });

  it('does NOT go past the last page or before the first', () => {
    expect(pageOf({ items: TWELVE, page: 9, size: 5 }).page).toBe(2);
    expect(pageOf({ items: TWELVE, page: -3, size: 5 }).page).toBe(0);
  });

  it('keeps one empty page for an empty list', () => {
    expect(pageOf({ items: [], page: 0, size: 5 })).toEqual({
      items: [],
      page: 0,
      pageCount: 1,
      from: 0,
      to: 0,
    });
  });
});
