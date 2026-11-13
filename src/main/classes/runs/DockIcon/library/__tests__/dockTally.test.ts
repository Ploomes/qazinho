import type { IDockTally } from '@/main/classes/runs/DockIcon/types';
import type { IRunEvent, IStepOutcome } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { EMPTY_DOCK_TALLY } from '@/main/classes/runs/DockIcon/constants';
import {
  dockViewOf,
  withDockEvent,
  withDockRun,
  withoutDockResult,
} from '@/main/classes/runs/DockIcon/library';

function started(workspaceId: string, total = 4): IDockTally {
  return withDockRun({ tally: EMPTY_DOCK_TALLY, workspaceId, total });
}

function step(props: {
  workspaceId: string;
  index: number;
  verdict: IStepOutcome['verdict'];
}): IRunEvent {
  return { kind: 'step', outcome: { ...props } as IStepOutcome };
}

function after(tally: IDockTally, ...events: IRunEvent[]): IDockTally {
  return events.reduce((acc, event) => withDockEvent({ tally: acc, event }), tally);
}

function done(workspaceId: string): IRunEvent {
  return { kind: 'done', workspaceId };
}

function view(tally: IDockTally, unseen = 0) {
  return dockViewOf({ tally, unseen });
}

describe('the dock icon tally', () => {
  it('shows the running icon from the moment a run begins, and drops it with the last run', () => {
    const tally = started('a');

    expect(view(tally).icon).toBe('running');
    expect(view(after(tally, done('a'))).icon).toBe('passed');
  });

  it('shows the thinking icon while a run waits for the QA, and goes back when answered', () => {
    const asked = after(started('a'), {
      kind: 'asked',
      workspaceId: 'a',
    } as IRunEvent);

    expect(view(asked).icon).toBe('thinking');

    const answered = after(asked, { kind: 'answered', workspaceId: 'a' } as IRunEvent);

    expect(view(answered).icon).toBe('running');
  });

  it('keeps thinking while any run still waits, even if another is running', () => {
    const tally = after(
      withDockRun({ tally: started('a'), workspaceId: 'b', total: 2 }),
      {
        kind: 'asked',
        workspaceId: 'b',
      } as IRunEvent,
    );

    expect(view(tally).icon).toBe('thinking');
  });

  it('reports progress as walked steps over all steps of the runs going', () => {
    let tally = started('a', 2);

    tally = withDockRun({ tally, workspaceId: 'b', total: 2 });
    tally = after(tally, step({ workspaceId: 'a', index: 0, verdict: 'passed' }));

    expect(view(tally).progress).toBe(0.25);
  });

  it('counts a step reported twice once, and a running step not at all', () => {
    const tally = after(
      started('a'),
      step({ workspaceId: 'a', index: 0, verdict: 'running' }),
      step({ workspaceId: 'a', index: 0, verdict: 'passed' }),
      step({ workspaceId: 'a', index: 0, verdict: 'passed' }),
    );

    expect(view(tally).progress).toBe(0.25);
  });

  it('has no progress for a run with no steps, like an exploration', () => {
    expect(view(started('a', 0)).progress).toBeNull();
  });

  it('shows the passed icon and a check when every run passed', () => {
    const tally = after(started('a', 1), done('a'));

    expect(view(tally)).toMatchObject({ icon: 'passed', badge: '✓' });
  });

  it('shows the bug icon with the failed steps of runs that went at the same time', () => {
    let tally = withDockRun({ tally: started('a', 3), workspaceId: 'b', total: 3 });

    tally = after(
      tally,
      step({ workspaceId: 'a', index: 0, verdict: 'failed' }),
      step({ workspaceId: 'b', index: 1, verdict: 'failed' }),
      done('a'),
    );

    expect(view(tally)).toMatchObject({ icon: 'running', badge: '' });

    expect(view(after(tally, done('b')))).toMatchObject({ icon: 'bug', badge: '2' });
  });

  it('shows the broken icon when a run broke, and not the bug one', () => {
    const tally = after(started('a', 3), {
      kind: 'failed',
      workspaceId: 'a',
      failure: { reason: 'agent-missing', agentId: 'claude' },
    });

    expect(view(tally)).toMatchObject({ icon: 'broken', badge: '!' });
  });

  it('shows the broken icon when one run broke and another found bugs', () => {
    const tally = after(
      withDockRun({ tally: started('a', 3), workspaceId: 'b', total: 3 }),
      step({ workspaceId: 'a', index: 0, verdict: 'failed' }),
      done('a'),
      {
        kind: 'failed',
        workspaceId: 'b',
        failure: { reason: 'agent-missing', agentId: 'claude' },
      },
    );

    expect(view(tally).icon).toBe('broken');
  });

  it('ignores events of a run it never saw begin', () => {
    expect(after(EMPTY_DOCK_TALLY, done('ghost'))).toBe(EMPTY_DOCK_TALLY);
  });

  it('forgets the last result when a new run begins', () => {
    const over = after(
      started('a', 1),
      step({ workspaceId: 'a', index: 0, verdict: 'failed' }),
      done('a'),
    );
    const again = withDockRun({ tally: over, workspaceId: 'a', total: 1 });

    expect(view(again)).toMatchObject({ icon: 'running', badge: '' });
  });

  it('keeps the same run when it begins twice', () => {
    const once = started('a', 2);

    expect(withDockRun({ tally: once, workspaceId: 'a', total: 9 })).toBe(once);
  });

  it('clears the result when the QA is back, but never while a run goes', () => {
    const running = started('a', 1);

    expect(withoutDockResult(running)).toBe(running);
    expect(view(withoutDockResult(after(running, done('a'))))).toMatchObject({
      icon: null,
      badge: '',
    });
  });

  it('shows the waiting count only when there is no result to show', () => {
    expect(view(EMPTY_DOCK_TALLY, 3).badge).toBe('3');
    expect(view(after(started('a', 1), done('a')), 3).badge).toBe('✓');
  });
});
