import { describe, expect, it } from 'vitest';
import { planSignalOf } from '@/app/components/Sidebar/library';

describe('planSignalOf', () => {
  it('puts a question the agent asks above everything else', () => {
    expect(planSignalOf({ shown: 'attention', bugs: 3 })).toEqual({
      kind: 'asking',
      count: 0,
    });
  });

  it('shows a run that goes or waits paused, over the bugs it already has', () => {
    expect(planSignalOf({ shown: 'running', bugs: 2 })).toEqual({
      kind: 'running',
      count: 0,
    });
    expect(planSignalOf({ shown: 'paused', bugs: 2 })).toEqual({
      kind: 'paused',
      count: 0,
    });
  });

  it('counts the open bugs of a plan at rest, whatever its last run did', () => {
    expect(planSignalOf({ shown: 'failed', bugs: 3 })).toEqual({
      kind: 'bugs',
      count: 3,
    });
    expect(planSignalOf({ shown: 'passed', bugs: 1 })).toEqual({
      kind: 'bugs',
      count: 1,
    });
  });

  it('marks a failed run that left no bug open', () => {
    expect(planSignalOf({ shown: 'failed', bugs: 0 })).toEqual({
      kind: 'failed',
      count: 0,
    });
  });

  /** O normal fica quieto: um plano que passou, parado ou novo não ganha marca. */
  it('shows nothing on a plan that needs nothing from the QA', () => {
    expect(planSignalOf({ shown: 'passed', bugs: 0 })).toBeNull();
    expect(planSignalOf({ shown: 'idle', bugs: 0 })).toBeNull();
    expect(planSignalOf({ shown: 'stopped', bugs: 0 })).toBeNull();
  });
});
