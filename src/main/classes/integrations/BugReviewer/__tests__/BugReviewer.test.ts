import type { IRunAgent } from '@/main/classes/agents/AgentRunner/types';
import type { IReviewBug, ITrackerIssue } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { BugReviewer } from '@/main/classes/integrations/BugReviewer';
import { Harness } from '@ploomes/qazinho-harness';

const ISSUE: ITrackerIssue = {
  key: 'SHOP-57',
  title: 'Expired coupon taken',
  url: 'https://acme.atlassian.net/browse/SHOP-57',
  status: 'In review',
  isClosed: false,
  body: 'The total drops.',
  comments: [],
};

const REQUEST: IReviewBug = {
  workspaceId: 'w-1',
  bugId: 'BUG-02',
  agentId: 'claude-code',
  model: 'haiku',
  language: 'en',
  issue: {
    tracker: 'jira',
    key: 'SHOP-57',
    url: ISSUE.url,
    at: '2026-10-22T12:00:00.000Z',
  },
  bug: {
    title: 'Expired coupon taken',
    expected: 'Este cupom expirou',
    got: 'R$ 90,00',
    body: '',
    caseTitle: 'An expired coupon is refused',
  },
  sightings: [
    {
      runId: 'r-05',
      runWhen: '14:02',
      caseId: 'TC-02',
      stepNumber: 2,
      action: 'Apply EXPIRED',
      note: 'Taken on mobile.',
      target: 'Web · Chrome 390 × 844',
      shot: '/data/runs/w-1/r-05/step-2.jpg',
      requests: [],
    },
    {
      runId: 'r-06',
      runWhen: '15:00',
      caseId: 'TC-02',
      stepNumber: 2,
      action: 'Apply EXPIRED',
      note: '',
      target: 'Web · Chrome 390 × 844',
      shot: '/etc/passwd',
      requests: [],
    },
  ],
};

/**
 * O agente do QA como o revisor o vê: responde o que lhe dizem, e lembra como foi
 * perguntado.
 */
function reviewer(
  props: { issue?: ITrackerIssue | null; answer?: string; isError?: boolean } = {},
) {
  const asked: IRunAgent[] = [];

  return {
    asked,
    reviewer: new BugReviewer({
      filer: {
        read: () =>
          Promise.resolve(
            props.issue === null
              ? {
                  isRead: false as const,
                  failure: 'not-found' as const,
                  said: 'Issue does not exist',
                }
              : { isRead: true as const, issue: props.issue ?? ISSUE },
          ),
      },
      runner: {
        ask: (run: IRunAgent) => {
          asked.push(run);

          return Promise.resolve({
            sessionId: 's-1',
            text:
              props.answer ??
              JSON.stringify({
                verdict: 'news',
                reason: 'On mobile too.',
                comment: 'It breaks at 390 × 844 too.',
              }),
            usage: null,
            costUsd: 0.01,
            isError: props.isError ?? false,
          });
        },
      },
      harness: new Harness(),
      findCommand: () => Promise.resolve('/usr/local/bin/claude'),
      runsRoot: '/data/runs',
    }),
  };
}

describe('BugReviewer', () => {
  describe('review', () => {
    it('asks the QA’s agent, read only on the workspace’s runs, and answers what it decided', async () => {
      const { reviewer: bugs, asked } = reviewer();

      expect(await bugs.review(REQUEST)).toEqual({
        isReviewed: true,
        verdict: 'news',
        reason: 'On mobile too.',
        comment: 'It breaks at 390 × 844 too.',
      });
      expect(asked[0]).toMatchObject({
        workspaceId: '~review/w-1/BUG-02',
        agentId: 'claude-code',
        model: 'haiku',
        sessionId: null,
        allowedTools: [],
        readDirs: ['/data/runs/w-1'],
      });
      expect(asked[0]?.prompt).toContain('Its screen: /data/runs/w-1/r-05/step-2.jpg');
    });

    it('does NOT hand the agent a screen outside the workspace’s runs', async () => {
      const { reviewer: bugs, asked } = reviewer();

      await bugs.review(REQUEST);

      expect(asked[0]?.prompt).not.toContain('/etc/passwd');
    });

    it('reads a bug back on a closed issue as a regression, whatever the agent said', async () => {
      const { reviewer: bugs } = reviewer({
        issue: { ...ISSUE, isClosed: true },
        answer: JSON.stringify({
          verdict: 'nothing-new',
          reason: 'Same as told.',
          comment: '',
        }),
      });

      expect(await bugs.review(REQUEST)).toMatchObject({
        isReviewed: true,
        verdict: 'regression',
      });
    });

    it('says why there is no review: the issue unread, or the agent out of the schema', async () => {
      expect(await reviewer({ issue: null }).reviewer.review(REQUEST)).toEqual({
        isReviewed: false,
        failure: 'tracker',
        said: 'Issue does not exist',
      });
      expect(
        await reviewer({ answer: 'The bug is back.' }).reviewer.review(REQUEST),
      ).toEqual({
        isReviewed: false,
        failure: 'agent',
        said: '',
      });
      expect(
        await reviewer({ answer: 'Not signed in', isError: true }).reviewer.review(
          REQUEST,
        ),
      ).toEqual({ isReviewed: false, failure: 'agent', said: 'Not signed in' });
    });

    it('does NOT ask anything for a workspace or bug that would climb out of the runs', async () => {
      const { reviewer: bugs, asked } = reviewer();

      expect(await bugs.review({ ...REQUEST, workspaceId: '../..' })).toMatchObject({
        isReviewed: false,
      });
      expect(asked).toEqual([]);
    });
  });
});
