import { describe, expect, it } from 'vitest';
import { syncedCaseOf } from '@/modules/Pro/library';
import { CASES } from '@/modules/Workspace/library/__tests__/fixtures';

describe('syncedCaseOf', () => {
  it('keeps what the case covers and its steps, not how its last run went', () => {
    const synced = syncedCaseOf({ ...CASES[0]!, lastVerdict: 'failed' });

    expect(synced).toEqual({
      id: 'TC-01',
      title: 'Open the store and find a product',
      priority: 'P1',
      goal: 'The site loads.',
      preconditions: 'The URL answers.',
      steps: CASES[0]?.steps,
    });
  });

  it('keeps where the case comes from and the doubts it waits on, only when it has them', () => {
    expect(
      syncedCaseOf({ ...CASES[0]!, sources: ['C2'], blockedBy: ['D1'] }),
    ).toMatchObject({ sources: ['C2'], blockedBy: ['D1'] });
    expect(syncedCaseOf({ ...CASES[0]!, sources: [] })).not.toHaveProperty('sources');
  });

  it('says a case is walked by hand only when it is', () => {
    expect(syncedCaseOf({ ...CASES[0]!, isManual: true }).isManual).toBe(true);
    expect(syncedCaseOf(CASES[0]!)).not.toHaveProperty('isManual');
  });

  it('keeps a step’s frame only where it names one', () => {
    const synced = syncedCaseOf({
      ...CASES[0]!,
      steps: [
        { action: 'Open', expected: 'Opens', frame: '1:2' },
        { action: 'Pay', expected: 'Paid' },
      ],
    });

    expect(synced.steps).toEqual([
      { action: 'Open', expected: 'Opens', frame: '1:2' },
      { action: 'Pay', expected: 'Paid' },
    ]);
    expect(synced.steps[1]).not.toHaveProperty('frame');
  });
});
