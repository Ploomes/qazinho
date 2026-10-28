// @vitest-environment jsdom
import type { ISuiteChangeCardProps } from '@/modules/Automation/screens/Automation/components/SuiteChangeCard/types';
import type { ISuiteChange } from '@/shared/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { suiteResult, suiteTest } from '@/modules/Automation/library/__tests__/fixtures';
import { useSuiteChangeCardViewModel } from '@/modules/Automation/screens/Automation/components/SuiteChangeCard/hooks/useSuiteChangeCardViewModel';

const CHANGE: ISuiteChange = {
  id: 'c-01',
  projectId: 'p-1',
  ask: { kind: 'fix', runId: 's-03', test: suiteTest({}) },
  startedAt: 1,
  endedAt: null,
  status: 'working',
  step: 'agent',
  branch: 'qazinho/fix-ct-nav-001',
  base: 'main',
  commit: 'c0ffee1234567',
  summary: '',
  message: { commit: '', title: '', body: '' },
  files: [],
  checks: [],
  failure: null,
  shipped: null,
};

function render(
  props: Omit<Partial<ISuiteChangeCardProps>, 'change'> & {
    change?: Partial<ISuiteChange>;
  } = {},
) {
  const handlers = {
    onStop: vi.fn(),
    onReview: vi.fn(),
    onDiscard: vi.fn(),
    onRetry: vi.fn(),
  };

  return {
    ...handlers,
    view: renderHook(() =>
      useSuiteChangeCardViewModel({
        notes: [],
        agent: 'Claude Code',
        ...handlers,
        ...props,
        change: { ...CHANGE, ...props.change },
      }),
    ).result.current,
  };
}

describe('useSuiteChangeCardViewModel', () => {
  describe('while the agent works', () => {
    it('says what it is doing, on which branch and from where, and lets the QA stop it', () => {
      const { view, onStop } = render({
        notes: [
          { id: 1, kind: 'said', text: 'a' },
          { id: 2, kind: 'said', text: 'b' },
          { id: 3, kind: 'ran', total: 1, passed: 0 },
          { id: 4, kind: 'said', text: '✎ ct-nav.spec.ts' },
          { id: 5, kind: 'ran', total: 3, passed: 3 },
        ],
      });

      expect(view).toMatchObject({
        title: 'The agent is fixing it',
        icon: 'running',
        mood: 'thinking',
        isStill: false,
        branch: 'qazinho/fix-ct-nav-001',
        from: 'from main · c0ffee1',
        step: 'The agent is reading the suite and fixing the test',
        notes: [
          { key: '2', icon: null, text: 'b' },
          { key: '3', icon: 'failed', text: 'Ran the test: it failed' },
          { key: '4', icon: null, text: '✎ ct-nav.spec.ts' },
          { key: '5', icon: 'passed', text: 'Ran 3 tests: 3 of 3 passed' },
        ],
        canStop: true,
        canReview: false,
        canDiscard: false,
      });

      view.onStop();

      expect(onStop).toHaveBeenCalledOnce();
    });
  });

  describe('once ready', () => {
    it("gives the agent's words, QAzinho's own run of the test and what changed, to review", () => {
      const { view } = render({
        change: {
          status: 'ready',
          step: null,
          summary: 'The link is "Carrinho" now.',
          checks: [suiteResult({})],
          files: [
            { path: 'a.ts', status: 'modified', additions: 2, deletions: 1, patch: '' },
            { path: 'b.ts', status: 'added', additions: 5, deletions: 0, patch: '' },
          ],
        },
      });

      expect(view).toMatchObject({
        title: 'Ready to review',
        isStill: true,
        summary: 'The link is "Carrinho" now.',
        check: { icon: 'passed', text: 'The test passes in the copy' },
        files: '2 files',
        added: '+7',
        removed: '−1',
        canReview: true,
        canDiscard: true,
        canRetry: false,
        canStop: false,
      });
    });

    it('says when the test still fails in the copy, or could not run again', () => {
      expect(
        render({
          change: { status: 'ready', checks: [suiteResult({ status: 'failed' })] },
        }).view.check,
      ).toMatchObject({ icon: 'failed', text: 'The test fails in the copy' });
      expect(
        render({ change: { status: 'ready', checks: [] } }).view.check,
      ).toMatchObject({
        icon: 'attention',
        text: 'QAzinho could not run the test again',
      });
    });
  });

  describe('when it ends short', () => {
    /**
     * Uma mudança que terminou sem nada nela não deixa branch: o cartão não nomeia
     * nenhuma.
     */
    it('names no branch once a change with nothing in it ended', () => {
      expect(render({ change: { status: 'app-bug', files: [] } }).view).toMatchObject({
        branch: '',
        from: '',
      });
    });

    it('says the app is wrong, and offers to throw it away but not to send it', () => {
      expect(
        render({ change: { status: 'app-bug', summary: 'The search ignores case.' } })
          .view,
      ).toMatchObject({
        title: 'It is the app, not the test',
        icon: 'bug',
        mood: 'bug',
        canReview: false,
        canDiscard: true,
      });
    });

    it("says why it broke in the agent's own words, and offers to try again", () => {
      const { view } = render({
        change: {
          status: 'broke',
          failure: {
            reason: 'agent',
            failure: { reason: 'agent-error', said: 'Rate limited.' },
          },
        },
      });

      expect(view).toMatchObject({
        failure: 'The agent stopped: Rate limited.',
        canRetry: true,
        canDiscard: true,
      });
    });

    it('names the agent that is signed out', () => {
      expect(
        render({
          change: {
            status: 'broke',
            failure: { reason: 'agent', failure: { reason: 'agent-signed-out' } },
          },
        }).view.failure,
      ).toBe('The agent stopped: Claude Code is signed out.');
    });

    it('says a folder git does not keep has no branch to work on', () => {
      expect(
        render({ change: { status: 'broke', failure: { reason: 'no-git', said: '' } } })
          .view.failure,
      ).toBe(
        "The suite's folder is not a git repository, so there is no branch to work on.",
      );
    });
  });

  describe('once sent', () => {
    it('links to the pull request it opened', () => {
      expect(
        render({
          change: {
            status: 'shipped',
            shipped: { way: 'pull-request', url: 'https://github.com/acme/e2e/pull/7' },
          },
        }).view,
      ).toMatchObject({
        title: 'Sent',
        shipped: {
          url: 'https://github.com/acme/e2e/pull/7',
          label: 'See the pull request',
        },
        canDiscard: false,
        canRetry: false,
      });
    });

    it('links to where to open the pull request, or names the branch away from GitHub', () => {
      expect(
        render({
          change: {
            status: 'shipped',
            shipped: {
              way: 'branch',
              url: 'https://github.com/acme/e2e/compare/main...x',
            },
          },
        }).view.shipped,
      ).toMatchObject({ label: 'Open a pull request on GitHub' });
      expect(
        render({ change: { status: 'shipped', shipped: { way: 'branch', url: null } } })
          .view.shipped,
      ).toEqual({ url: null, label: 'Sent as qazinho/fix-ct-nav-001' });
    });
  });

  describe('a new test', () => {
    const WRITE = {
      ask: {
        kind: 'write' as const,
        text: 'The cart keeps its items.',
        folder: '',
        source: null,
      },
    };

    it('says the agent is writing it', () => {
      expect(
        render({ change: { ...WRITE, status: 'working', step: 'agent' } }).view,
      ).toMatchObject({
        title: 'The agent is writing it',
        step: 'The agent is reading the suite and writing the test',
      });
    });

    it('counts the tests of its files QAzinho ran again', () => {
      expect(
        render({
          change: {
            ...WRITE,
            status: 'ready',
            checks: [suiteResult({}), suiteResult({ status: 'failed' })],
          },
        }).view.check,
      ).toMatchObject({ icon: 'failed', text: '1 of 2 tests fail in the copy' });
    });

    /**
     * Um teste novo que o app falha está certo, e pega um bug: ainda pode ser enviado.
     */
    it('lets the QA review a new test the app fails', () => {
      expect(
        render({
          change: {
            ...WRITE,
            status: 'app-bug',
            checks: [suiteResult({ status: 'failed' })],
            files: [
              {
                path: 'a.spec.ts',
                status: 'added',
                additions: 9,
                deletions: 0,
                patch: '',
              },
            ],
          },
        }).view,
      ).toMatchObject({
        title: 'It is the app, not the test',
        canReview: true,
        check: { text: 'The test fails in the copy' },
      });
    });
  });
});
