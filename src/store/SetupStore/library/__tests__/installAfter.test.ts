import { describe, expect, it } from 'vitest';
import { installAfter } from '@/store/SetupStore/library';

const INSTALLING = { phase: 'installing' as const, stage: 1, stages: 4, line: '' };

describe('installAfter', () => {
  it('follows the stage and the last line of an install under way', () => {
    expect(
      installAfter({
        state: INSTALLING,
        news: { item: 'axe', stage: 2, stages: 4, line: '==> Extracting AXe' },
      }),
    ).toEqual({
      phase: 'installing',
      stage: 2,
      stages: 4,
      line: '==> Extracting AXe',
    });
  });

  it('marks it installed when it ends well', () => {
    expect(installAfter({ state: INSTALLING, news: { isInstalled: true } })).toEqual({
      phase: 'installed',
    });
  });

  it('keeps the error and the command when it fails', () => {
    expect(
      installAfter({
        state: INSTALLING,
        news: {
          isInstalled: false,
          failure: { reason: 'said' as const, text: 'EACCES' },
          command: 'npm install -g x',
          isFix: false,
        },
      }),
    ).toEqual({
      phase: 'failed',
      failure: { reason: 'said' as const, text: 'EACCES' },
      command: 'npm install -g x',
      isFix: false,
    });
  });

  it('does NOT reopen an install that already ended because of a late line', () => {
    expect(
      installAfter({
        state: { phase: 'installed' },
        news: { item: 'codex', stage: 1, stages: 1, line: 'late' },
      }),
    ).toEqual({ phase: 'installed' });
  });
});
