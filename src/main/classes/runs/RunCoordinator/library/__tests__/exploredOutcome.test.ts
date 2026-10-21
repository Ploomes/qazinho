import { describe, expect, it } from 'vitest';
import { exploredOutcome } from '@/main/classes/runs/RunCoordinator/library';

describe('exploredOutcome', () => {
  it('makes a screen the explorer reached a step of the exploration, with its picture', () => {
    expect(
      exploredOutcome({
        workspaceId: 'w1',
        screen: { name: 'Cart', about: 'What the buyer picked.' },
        number: 2,
        tookMs: 4_000,
        at: 9_000,
        shot: { file: '/tmp/screen-2.jpg', dataUrl: 'data:image/jpeg;base64,x' },
      }),
    ).toEqual({
      workspaceId: 'w1',
      caseId: 'EX',
      stepNumber: 2,
      index: 1,
      action: 'Cart',
      expected: '',
      verdict: 'passed',
      why: 'What the buyer picked.',
      got: '',
      title: '',
      severity: 'low',
      tookMs: 4_000,
      at: 9_000,
      screenshot: 'data:image/jpeg;base64,x',
      shotFile: '/tmp/screen-2.jpg',
    });
  });

  it('keeps a screen with no picture when the device could not take one', () => {
    expect(
      exploredOutcome({
        workspaceId: 'w1',
        screen: { name: 'Shop', about: 'The home.' },
        number: 1,
        tookMs: 0,
        at: 1,
        shot: null,
      }),
    ).toMatchObject({ screenshot: null, shotFile: null });
  });
});
