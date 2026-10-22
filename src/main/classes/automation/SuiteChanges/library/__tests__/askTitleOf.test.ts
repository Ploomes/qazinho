import type { SuiteChangeAsk } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { askTitleOf } from '@/main/classes/automation/SuiteChanges/library';

const write = (
  props: Partial<Extract<SuiteChangeAsk, { kind: 'write' }>>,
): SuiteChangeAsk => ({
  kind: 'write',
  text: '',
  folder: '',
  source: null,
  ...props,
});

describe('askTitleOf', () => {
  it('names a fix by the test that broke', () => {
    expect(
      askTitleOf({
        kind: 'fix',
        runId: 's-01',
        test: {
          id: 't',
          file: 'a.spec.ts',
          line: 1,
          path: [],
          title: 'CT-NAV-002 · Abre o carrinho',
          tags: [],
          project: '',
        },
      }),
    ).toBe('CT-NAV-002 · Abre o carrinho');
  });

  it('names a new test by its plan case, else by the first line the QA wrote', () => {
    expect(
      askTitleOf(
        write({
          text: 'Whatever',
          source: {
            workspace: 'W',
            id: 'TC-03',
            title: 'Cart survives a reload',
            goal: '',
            preconditions: '',
            steps: [],
          },
        }),
      ),
    ).toBe('Cart survives a reload');
    expect(
      askTitleOf(write({ text: '  The cart keeps its items\nafter a reload.' })),
    ).toBe('The cart keeps its items');
  });

  it('keeps a long request to one short line', () => {
    const title = askTitleOf(write({ text: 'word '.repeat(40) }));

    expect(title.length).toBeLessThanOrEqual(72);
    expect(title.endsWith('…')).toBe(true);
  });
});
