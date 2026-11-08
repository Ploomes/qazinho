import { describe, expect, it } from 'vitest';
import { RUN_WATCH } from '@/main/classes/runs/RunCoordinator/constants';
import { progressAside } from '@/main/classes/runs/RunCoordinator/library/progressAside';

const watch = (changes = {}) => ({ actions: 1, sinceSay: 1, askedAt: 0, ...changes });
const aside = (changes = {}, tookMs = 0) =>
  progressAside({ watch: watch(changes), stepNumber: 3, tookMs });

describe('progressAside', () => {
  it('stays quiet while the step moves', () => {
    expect(aside().text).toBeNull();
  });

  it('reminds the agent to say why once the QA heard nothing for a while', () => {
    const { text, watch: after } = aside({
      actions: RUN_WATCH.sayEveryActions,
      sinceSay: RUN_WATCH.sayEveryActions,
    });

    expect(text).toContain('Call say');
    expect(after.sinceSay).toBe(0);
  });

  it('tells it to ask the QA when the step takes too many actions', () => {
    const { text, watch: after } = aside({
      actions: RUN_WATCH.askAfterActions,
      sinceSay: 2,
    });

    expect(text).toContain('ask_qa');
    expect(after.askedAt).toBe(RUN_WATCH.askAfterActions);
  });

  it('tells it to ask the QA when the step takes too long, even with few actions', () => {
    expect(aside({ actions: 3 }, RUN_WATCH.askAfterMs).text).toContain('ask_qa');
  });

  it('does NOT tell it again until it has tried a while longer', () => {
    const asked = RUN_WATCH.askAfterActions;

    expect(aside({ actions: asked + 1, askedAt: asked }).text).toBeNull();
    expect(
      aside({ actions: asked + RUN_WATCH.askAgainActions, askedAt: asked }).text,
    ).toContain('ask_qa');
  });

  it('does NOT rush a step on which nothing was done yet', () => {
    expect(aside({ actions: 0, sinceSay: 0 }, RUN_WATCH.askAfterMs).text).toBeNull();
  });
});
