import { describe, expect, it } from 'vitest';
import { recipeBookOf } from '@/main/classes/pro/ProDownloads/library';

describe('recipeBookOf', () => {
  it('keeps each recording as a recipe the runs here walk again', () => {
    expect(
      recipeBookOf([
        {
          caseId: 'TC-01',
          fingerprint: 'fp',
          targetKind: 'web',
          steps: [{ number: 1 }],
          recordedAt: '2026-10-24T10:00:00.000Z',
        },
      ]),
    ).toEqual({
      cases: [
        {
          caseId: 'TC-01',
          fingerprint: 'fp',
          targetKind: 'web',
          steps: [{ number: 1 }],
          runId: 'org',
          recordedAt: Date.UTC(2026, 9, 24, 10),
        },
      ],
    });
  });

  it('dates a recording with no readable moment at the start of time', () => {
    expect(
      recipeBookOf([
        {
          caseId: 'TC-01',
          fingerprint: 'fp',
          targetKind: 'web',
          steps: [],
          recordedAt: 'soon',
        },
      ]).cases[0]?.recordedAt,
    ).toBe(0);
  });
});
