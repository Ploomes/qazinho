// @vitest-environment jsdom
import type { IBug, IBugReview } from '@/modules/Bug/types';
import type { ChangeEvent } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBugUpdateViewModel } from '@/modules/Bug/screens/Bugs/components/BugPage/components/BugUpdate/hooks';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useSettingsStore, useSetupStore, useWorkspaceStore } from '@/store';

const REVIEW: IBugReview = {
  runs: ['r-02', 'r-03'],
  state: 'suggested',
  verdict: 'news',
  reason: 'It also breaks on mobile.',
  comment: 'It breaks at 390 × 844 too.',
  url: null,
  error: '',
  at: '',
};
const BASE = walkRun({ verdicts: ['passed', 'failed'] });
const BUG: IBug = {
  ...BASE.bugs[0]!,
  filed: {
    tracker: 'jira',
    key: 'SHOP-57',
    url: 'https://acme.atlassian.net/browse/SHOP-57',
    at: '',
  },
  review: REVIEW,
};

const update = (review: IBugReview | null) =>
  renderHook(() => useBugUpdateViewModel({ workspaceId: 'w1', bug: { ...BUG, review } }));

/** Um bug registrado que voltou numa run que ninguém pesou ainda. */
const SEEN_AGAIN: IBug = {
  ...BUG,
  review: null,
  sightings: [
    {
      runId: 'r-02',
      runWhen: '',
      caseId: 'TC-02',
      stepNumber: 2,
      at: 0,
      shot: { isBad: true, src: null, file: null },
    },
  ],
};

const pending = (bug: IBug) =>
  renderHook(() => useBugUpdateViewModel({ workspaceId: 'w1', bug }));

beforeEach(() => {
  useSettingsStore.setState({ agent: 'Claude Code', language: 'en', tab: 'general' });
  useSetupStore.setState({ integrations: [] });
  useAppStore.setState({ screen: 'workspace' });
  useWorkspaceStore.setState({ workspaces: [{ ...BASE, bugs: [BUG] }] });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    commentBug: vi
      .fn()
      .mockResolvedValue({ isPosted: true, url: 'https://j/1', missed: [] }),
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useBugUpdateViewModel', () => {
  it('shows the update the agent suggests, why, and lets the QA edit it', () => {
    const { result } = update(REVIEW);

    expect(result.current).toMatchObject({
      isShown: true,
      title: 'Update suggested for SHOP-57',
      reason: 'It also breaks on mobile.',
      comment: 'It breaks at 390 × 844 too.',
      canPost: true,
      postLabel: 'Post on SHOP-57',
      icon: 'sparkle',
    });

    act(() => {
      result.current.onComment({
        target: { value: 'Edited.' },
      } as ChangeEvent<HTMLTextAreaElement>);
    });

    expect(result.current.comment).toBe('Edited.');
  });

  it('says it is a regression when the issue was closed', () => {
    expect(update({ ...REVIEW, verdict: 'regression' }).result.current).toMatchObject({
      title: 'SHOP-57 was closed, and the bug came back',
      icon: 'attention',
      className: 'bug-update bug-update--suggested bug-update--regression',
    });
  });

  it('says the agent is weighing the runs, then that nothing is new, in one line', () => {
    expect(update({ ...REVIEW, state: 'reviewing' }).result.current).toMatchObject({
      isWorking: true,
      isEditable: false,
      title: 'Claude Code is comparing r-02, r-03 with SHOP-57…',
    });
    expect(
      update({ ...REVIEW, state: 'nothing-new', reason: 'Same as told.' }).result.current,
    ).toMatchObject({
      isEditable: false,
      title: 'Nothing new for SHOP-57: Same as told.',
    });
  });

  it('does NOT let an empty update be posted, nor show one put aside', () => {
    const { result } = update(REVIEW);

    act(() => {
      result.current.onComment({
        target: { value: ' ' },
      } as ChangeEvent<HTMLTextAreaElement>);
    });

    expect(result.current.canPost).toBe(false);
    expect(update({ ...REVIEW, state: 'dismissed' }).result.current.isShown).toBe(false);
    expect(update(null).result.current.isShown).toBe(false);
  });

  it('posts the QA’s words, puts it aside, and tries a failed look again', async () => {
    const { result } = update(REVIEW);

    await act(async () => {
      result.current.onPost();
      await Promise.resolve();
    });

    expect(window.qazinho.commentBug).toHaveBeenCalled();

    act(() => {
      result.current.onDismiss();
    });

    expect(useWorkspaceStore.getState().workspaces[0]?.bugs[0]?.review?.state).toBe(
      'dismissed',
    );
  });

  it('opens the posted update', () => {
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    const { result } = update({
      ...REVIEW,
      state: 'posted',
      url: 'https://j/SHOP-57?c=1',
    });

    expect(result.current).toMatchObject({
      isPosted: true,
      viewLabel: 'See the comment',
    });

    result.current.onView();

    expect(opened).toHaveBeenCalledWith('https://j/SHOP-57?c=1', '_blank', 'noreferrer');
    opened.mockRestore();
  });

  /** Desde 12/11 nada revisa sozinho ao abrir o app: o cartão pede o clique do QA. */
  it('offers to review a filed bug seen again in runs nobody weighed', async () => {
    useSetupStore.setState({
      integrations: [{ id: 'jira', account: 'qa', site: null, connectedAt: '' }],
    });
    const reviewBug = vi
      .fn()
      .mockResolvedValue({ isReviewed: false, failure: 'agent', said: '' });

    window.qazinho = { ...window.qazinho, reviewBug };
    useWorkspaceStore.setState({ workspaces: [{ ...BASE, bugs: [SEEN_AGAIN] }] });
    const { result } = pending(SEEN_AGAIN);

    expect(result.current).toMatchObject({
      isShown: true,
      isPending: true,
      icon: 'attention',
      title: 'Seen again in 1 run since SHOP-57',
      pendingLabel: 'Review',
      isEditable: false,
    });

    await act(async () => {
      result.current.onPending();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(reviewBug).toHaveBeenCalled();
    });
  });

  it('sends the QA to connect the tracker when it is not connected', () => {
    const { result } = pending(SEEN_AGAIN);

    expect(result.current.pendingLabel).toBe('Connect Jira');

    act(() => {
      result.current.onPending();
    });

    expect(useSettingsStore.getState().tab).toBe('connections');
    expect(useAppStore.getState().screen).toBe('settings');
  });

  it('does NOT ask again while a suggestion waits, nor for runs already weighed', () => {
    expect(pending({ ...SEEN_AGAIN, review: REVIEW }).result.current.isPending).toBe(
      false,
    );
    expect(
      pending({ ...SEEN_AGAIN, reviewedRuns: ['r-02'] }).result.current.isShown,
    ).toBe(false);
  });
});
