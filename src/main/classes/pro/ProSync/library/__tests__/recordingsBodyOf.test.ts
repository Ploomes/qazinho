import { describe, expect, it } from 'vitest';
import { recordingsBodyOf } from '@/main/classes/pro/ProSync/library';

describe('recordingsBodyOf', () => {
  it('never sends how far a case got, which the org would count as developed', () => {
    const text = JSON.stringify({
      cases: [],
      partial: [{ caseId: 'c1', fingerprint: 'fp', targetKind: 'web', steps: [] }],
    });

    expect(recordingsBodyOf({ text, branch: 'main' })).toEqual({
      branch: 'main',
      recordings: [],
    });
  });

  it('turns each recipe into a recording of the branch, with when it was recorded', () => {
    const text = JSON.stringify({
      cases: [
        {
          caseId: 'c1',
          fingerprint: 'fp',
          targetKind: 'web',
          steps: [{ number: 1, actions: [], proof: 'Carrinho' }],
          runId: 'r1',
          recordedAt: Date.UTC(2026, 9, 24, 10),
        },
      ],
    });

    expect(recordingsBodyOf({ text, branch: 'main' })).toEqual({
      branch: 'main',
      recordings: [
        {
          caseId: 'c1',
          fingerprint: 'fp',
          targetKind: 'web',
          steps: [{ number: 1, actions: [], proof: 'Carrinho' }],
          recordedAt: '2026-10-24T10:00:00.000Z',
        },
      ],
    });
  });

  it('reads nothing from a workspace with no recipes, or from a file that does not read', () => {
    expect(recordingsBodyOf({ text: null, branch: 'main' })).toBeNull();
    expect(recordingsBodyOf({ text: '{ not json', branch: 'main' })).toBeNull();
    expect(recordingsBodyOf({ text: '{"cases":"no"}', branch: 'main' })).toBeNull();
  });

  it('skips a recipe that names no case', () => {
    expect(
      recordingsBodyOf({ text: '{"cases":[{"fingerprint":"fp"}]}', branch: 'main' }),
    ).toEqual({ branch: 'main', recordings: [] });
  });
});
