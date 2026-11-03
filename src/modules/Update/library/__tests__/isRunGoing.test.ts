import type { IWorkspace } from '@/modules/Workspace';
import { describe, expect, it } from 'vitest';
import { isRunGoing } from '@/modules/Update/library';

const going = { isDone: false } as NonNullable<IWorkspace['live']>;
const done = { isDone: true } as NonNullable<IWorkspace['live']>;

describe('isRunGoing', () => {
  it('sees a run still walking in any workspace', () => {
    expect(isRunGoing([{ live: null }, { live: going }])).toBe(true);
  });

  it('does NOT count a run that ended', () => {
    expect(isRunGoing([{ live: done }])).toBe(false);
  });

  it('is false with no workspace at all', () => {
    expect(isRunGoing([])).toBe(false);
  });
});
