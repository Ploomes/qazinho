// @vitest-environment jsdom
import type { IBug, IBugReview } from '@/modules/Bug/types';
import type { ChangeEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBugUpdateViewModel } from '@/modules/Bug/screens/Bugs/components/BugPage/components/BugUpdate/hooks';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useSettingsStore, useWorkspaceStore } from '@/store';

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

beforeEach(() => {
  useSettingsStore.setState({ agent: 'Claude Code', language: 'en' });
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
});
