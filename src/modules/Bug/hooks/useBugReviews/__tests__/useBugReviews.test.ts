// @vitest-environment jsdom
import type { IBug } from '@/modules/Bug/types';
import type { ICommentBug, IReviewBug } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBugReviews } from '@/modules/Bug/hooks/useBugReviews';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import {
  useMachineStore,
  useSettingsStore,
  useSetupStore,
  useWorkspaceStore,
} from '@/store';

const WORKSPACE = walkRun({ verdicts: ['passed', 'failed'], isFinished: true });
const FILED = {
  tracker: 'jira' as const,
  key: 'SHOP-57',
  url: 'https://acme.atlassian.net/browse/SHOP-57',
  at: '2026-10-22T12:00:00.000Z',
};
const BUG: IBug = {
  ...WORKSPACE.bugs[0]!,
  filed: FILED,
  reviewedRuns: ['r-01'],
  sightings: [
    {
      runId: 'r-02',
      runWhen: '10:05',
      caseId: 'TC-01',
      stepNumber: 2,
      at: 1_760_000_100_000,
      shot: { isBad: true, src: null, file: '/data/runs/w1/r-02/step-2.jpg' },
    },
  ],
};

let reviewed: IReviewBug[] = [];
let commented: ICommentBug[] = [];

const bugNow = () => useWorkspaceStore.getState().workspaces[0]?.bugs[0];

beforeEach(() => {
  reviewed = [];
  commented = [];
  useWorkspaceStore.setState({ workspaces: [{ ...WORKSPACE, bugs: [BUG] }] });
  useSettingsStore.setState({ agent: 'Claude Code', model: 'haiku', language: 'en' });
  useMachineStore.setState({
    agents: [{ id: 'claude-code', name: 'Claude Code' }] as never,
  });
  useSetupStore.setState({
    integrations: [
      {
        id: 'jira',
        account: 'qa@acme.com',
        site: 'acme.atlassian.net',
        connectedAt: '2026-10-22T11:00:00.000Z',
      },
    ],
  });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    reviewBug: (request) => {
      reviewed.push(request);

      return Promise.resolve({
        isReviewed: true,
        verdict: 'news',
        reason: 'It also breaks on mobile.',
        comment: 'It breaks at 390 × 844 too.',
      });
    },
    commentBug: (request) => {
      commented.push(request);

      return Promise.resolve({
        isPosted: true,
        url: `${FILED.url}?focusedCommentId=1`,
        missed: [],
      });
    },
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useBugReviews', () => {
  describe('reviewWorkspace', () => {
    it('asks the QA’s agent about each filed bug that came back, and lands its update', async () => {
      const { result } = renderHook(() => useBugReviews());

      act(() => {
        result.current.reviewWorkspace('w1');
      });

      expect(bugNow()?.review?.state).toBe('reviewing');
      await waitFor(() => {
        expect(bugNow()?.review?.state).toBe('suggested');
      });
      expect(reviewed[0]).toMatchObject({
        workspaceId: 'w1',
        bugId: BUG.id,
        agentId: 'claude-code',
        model: 'haiku',
        issue: FILED,
        sightings: [{ runId: 'r-02', shot: '/data/runs/w1/r-02/step-2.jpg' }],
      });
      expect(bugNow()?.review).toMatchObject({
        runs: ['r-02'],
        verdict: 'news',
        comment: 'It breaks at 390 × 844 too.',
      });
      expect(bugNow()?.reviewedRuns).toEqual(['r-01', 'r-02']);
    });

    it('does NOT ask about a bug never filed, or one whose runs were all weighed', async () => {
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...WORKSPACE,
            bugs: [
              { ...BUG, filed: null },
              { ...BUG, id: 'BUG-02', reviewedRuns: ['r-01', 'r-02'] },
            ],
          },
        ],
      });

      const { result } = renderHook(() => useBugReviews());

      await act(async () => {
        result.current.reviewWorkspace('w1');
        await Promise.resolve();
      });

      expect(reviewed).toEqual([]);
    });

    it('does NOT ask twice about a bug while its review is still going', async () => {
      const reviewBug = vi.fn(() => new Promise<never>(() => undefined));

      window.qazinho.reviewBug = reviewBug;

      const { result } = renderHook(() => useBugReviews());

      act(() => {
        result.current.reviewWorkspace('w1');
      });
      await waitFor(() => {
        expect(reviewBug).toHaveBeenCalledTimes(1);
      });
      await act(async () => {
        result.current.reviewWorkspace('w1');
        await Promise.resolve();
      });

      expect(reviewBug).toHaveBeenCalledTimes(1);
    });

    it('does NOT ask while the bug’s tracker is not connected', async () => {
      useSetupStore.setState({ integrations: [] });

      const { result } = renderHook(() => useBugReviews());

      await act(async () => {
        result.current.reviewWorkspace('w1');
        await Promise.resolve();
      });

      expect(reviewed).toEqual([]);
      expect(bugNow()?.review).toBeNull();
    });

    it('says why it could not, and leaves the runs to weigh again', async () => {
      window.qazinho.reviewBug = () =>
        Promise.resolve({
          isReviewed: false,
          failure: 'tracker',
          said: 'Issue does not exist',
        });

      const { result } = renderHook(() => useBugReviews());

      act(() => {
        result.current.reviewWorkspace('w1');
      });

      await waitFor(() => {
        expect(bugNow()?.review?.state).toBe('failed');
      });
      expect(bugNow()?.review?.reason).toBe(
        'QAzinho could not read SHOP-57 in Jira. Issue does not exist',
      );
      expect(bugNow()?.reviewedRuns).toEqual(['r-01']);
    });

    it('leaves out what the agent said when it is a wall of text', async () => {
      window.qazinho.reviewBug = () =>
        Promise.resolve({
          isReviewed: false,
          failure: 'agent',
          said: `SyntaxError: Unexpected token\n    at ${'x'.repeat(200)}`,
        });

      const { result } = renderHook(() => useBugReviews());

      act(() => {
        result.current.reviewWorkspace('w1');
      });

      await waitFor(() => {
        expect(bugNow()?.review?.state).toBe('failed');
      });
      expect(bugNow()?.review?.reason).not.toContain('    at');
      expect(bugNow()?.review?.reason).toMatch(/SyntaxError: Unexpected token$/);
    });

    it('drops a single line too long to read on the card', async () => {
      window.qazinho.reviewBug = () =>
        Promise.resolve({ isReviewed: false, failure: 'agent', said: 'y'.repeat(161) });

      const { result } = renderHook(() => useBugReviews());

      act(() => {
        result.current.reviewWorkspace('w1');
      });

      await waitFor(() => {
        expect(bugNow()?.review?.state).toBe('failed');
      });
      expect(bugNow()?.review?.reason).not.toContain('yyyy');
    });
  });

  describe('post', () => {
    const SUGGESTED = {
      runs: ['r-02'],
      state: 'suggested' as const,
      verdict: 'regression' as const,
      reason: 'Back.',
      comment: 'It is back.',
      url: null,
      error: '',
      at: '',
    };

    it('posts the QA’s words under the issue, the regression first, with the new screen', async () => {
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...WORKSPACE,
            bugs: [{ ...BUG, review: SUGGESTED, reviewedRuns: ['r-01', 'r-02'] }],
          },
        ],
      });

      const { result } = renderHook(() => useBugReviews());

      await act(async () => {
        await result.current.post({
          workspaceId: 'w1',
          bugId: BUG.id,
          comment: 'Edited by the QA.',
        });
      });

      expect(commented[0]?.issue).toEqual(FILED);
      expect(commented[0]?.report.blocks.slice(0, 2)).toEqual([
        { kind: 'paragraph', text: 'This bug came back after the issue was closed.' },
        { kind: 'paragraph', text: 'Edited by the QA.' },
      ]);
      expect(commented[0]?.shots).toEqual([
        { name: `${BUG.id} r-02`, file: '/data/runs/w1/r-02/step-2.jpg', src: null },
      ]);
      expect(bugNow()?.review).toMatchObject({
        state: 'posted',
        url: `${FILED.url}?focusedCommentId=1`,
        comment: 'Edited by the QA.',
      });
    });

    it('keeps the update to post again, with why, when the tracker refused it', async () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...WORKSPACE, bugs: [{ ...BUG, review: SUGGESTED }] }],
      });
      window.qazinho.commentBug = vi.fn().mockResolvedValue({
        isPosted: false,
        failure: 'rejected',
        said: 'No permission.',
      });

      const { result } = renderHook(() => useBugReviews());

      await act(async () => {
        await result.current.post({
          workspaceId: 'w1',
          bugId: BUG.id,
          comment: 'It is back.',
        });
      });

      expect(bugNow()?.review).toMatchObject({
        state: 'suggested',
        error: 'Jira did not take the update. No permission.',
      });
    });
  });

  describe('dismiss', () => {
    it('puts the update aside', () => {
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...WORKSPACE,
            bugs: [
              {
                ...BUG,
                review: {
                  runs: ['r-02'],
                  state: 'suggested',
                  verdict: 'news',
                  reason: '',
                  comment: 'x',
                  url: null,
                  error: '',
                  at: '',
                },
              },
            ],
          },
        ],
      });

      const { result } = renderHook(() => useBugReviews());

      act(() => {
        result.current.dismiss({ workspaceId: 'w1', bugId: BUG.id });
      });

      expect(bugNow()?.review?.state).toBe('dismissed');
    });
  });
});
