import { describe, expect, it } from 'vitest';
import { runFactsOf } from '@/modules/Chat/library';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

const RUN = walkRun({
  verdicts: ['passed', 'passed', 'passed', 'passed', 'failed', 'skipped'],
  isFinished: true,
}).runs[0]!;

describe('runFactsOf', () => {
  it('reads a run step by step, with how it ended', () => {
    const facts = runFactsOf({ run: RUN, isBrief: false });

    expect(facts[0]).toBe('started 09:41, took 0s, walked the whole plan');
    expect(facts[1]).toBe('4 passed, 1 failed, 0 blocked, 1 skipped');
    expect(facts).toContain('  step 1 passed: Open the target URL');
    expect(facts).toContain(
      '  step 2 failed: Leave the house number empty (The page did not do it.)',
    );
  });

  it('says what the run cost when its agent said', () => {
    expect(runFactsOf({ run: { ...RUN, costUsd: 0.0412 }, isBrief: false })[0]).toBe(
      'started 09:41, took 0s, cost $0.041, walked the whole plan',
    );
  });

  it('keeps only what failed or was blocked when brief, and leaves a case that held out', () => {
    const facts = runFactsOf({ run: RUN, isBrief: true });

    expect(facts.slice(2)).toEqual([
      'TC-02 Checkout with a test card: failed',
      '  step 2 failed: Leave the house number empty (The page did not do it.)',
    ]);
  });
});
