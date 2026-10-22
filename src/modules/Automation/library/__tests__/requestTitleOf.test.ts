import { describe, expect, it } from 'vitest';
import { requestTitleOf } from '@/modules/Automation/library';
import { suiteTest } from './fixtures';

describe('requestTitleOf', () => {
  it('names a fix by the test that broke', () => {
    expect(requestTitleOf({ kind: 'fix', runId: 's-01', test: suiteTest({}) })).toBe(
      'CT-NAV-001 · Abre a lista',
    );
  });

  it('names a new test by its plan case, else by the first line the QA wrote', () => {
    expect(
      requestTitleOf({
        kind: 'write',
        text: 'x',
        folder: '',
        source: {
          workspace: 'W',
          id: 'TC-03',
          title: 'Cart survives a reload',
          goal: '',
          preconditions: '',
          steps: [],
        },
      }),
    ).toBe('Cart survives a reload');
    expect(
      requestTitleOf({
        kind: 'write',
        text: 'The cart\nkeeps',
        folder: '',
        source: null,
      }),
    ).toBe('The cart');
  });

  it('keeps a long request to one short line', () => {
    expect(
      requestTitleOf({
        kind: 'write',
        text: 'word '.repeat(40),
        folder: '',
        source: null,
      }).length,
    ).toBeLessThanOrEqual(72);
  });
});
