import { describe, expect, it } from 'vitest';
import { usageTotalsOf } from '@/modules/Usage/library';
import { spend } from './fixtures';

describe('usageTotalsOf', () => {
  it('adds the cost the agent said and every kind of token', () => {
    expect(usageTotalsOf([spend(), spend({ costUsd: 0.25, input: 50 })])).toEqual({
      costUsd: 0.75,
      hasCost: true,
      hasUnpriced: false,
      input: 150,
      output: 40,
      cacheRead: 2000,
      cacheWrite: 160,
      tokens: 2350,
    });
  });

  /** O Codex não diz o custo: os tokens dele contam, o custo não. */
  it('says when some spend came with no cost', () => {
    const totals = usageTotalsOf([spend(), spend({ agentId: 'codex', costUsd: null })]);

    expect(totals).toMatchObject({ costUsd: 0.5, hasCost: true, hasUnpriced: true });
  });

  it('is zero for nothing spent', () => {
    expect(usageTotalsOf([])).toMatchObject({ costUsd: 0, hasCost: false, tokens: 0 });
  });
});
